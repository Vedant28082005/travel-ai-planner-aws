from fastapi import FastAPI, Body
from fastapi.responses import JSONResponse
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from io import BytesIO
import boto3
import os
import uuid
from botocore.exceptions import NoCredentialsError
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

app = FastAPI()

# Initialize S3 Client
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1"),
)
BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "travel-planner-pdfs-bucket")

def create_table(data_list, header):
    """Helper to create formatted tables for logistics"""
    if not data_list:
        return None
    
    # Create Table Data
    table_data = [header]
    for item in data_list:
        # Extract values based on header keys
        row = [str(val) for val in item.values()][:len(header)]
        table_data.append(row)
    
    # Create Table
    t = Table(table_data, colWidths=[120, 100, 80, 120])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1f4e79")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
    ]))
    return t

@app.post("/generate-pdf")
def generate_pdf(data: dict = Body(...)):
    try:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        
        # Custom Styles
        title_style = ParagraphStyle('TitleStyle', parent=styles['Title'], fontSize=24, textColor=colors.HexColor("#1f4e79"), spaceAfter=20)
        h2_style = ParagraphStyle('H2Style', parent=styles['Heading2'], fontSize=16, textColor=colors.HexColor("#2e75b6"), spaceBefore=15, spaceAfter=10)
        day_style = ParagraphStyle('DayStyle', parent=styles['Normal'], fontSize=12, leading=14, spaceAfter=8)

        content = []

        # 1. Header Section
        content.append(Paragraph(f"Explore {data.get('destination', 'Your Trip')}", title_style))
        content.append(Paragraph(f"<b>From:</b> {data.get('origin')} | <b>Duration:</b> {data.get('days')} Days", styles["Normal"]))
        content.append(Paragraph(f"<b>Estimated Budget:</b> ₹{data.get('budget', {}).get('total', 'N/A')}", styles["Normal"]))
        content.append(Spacer(1, 20))

        # 2. Itinerary Section
        content.append(Paragraph("Your Daily Itinerary", h2_style))
        for item in data.get("itinerary", []):
            content.append(Paragraph(f"<b>Day {item['day']}</b>", styles["Normal"]))
            content.append(Paragraph(item['plan'], day_style))
            content.append(Spacer(1, 5))

        # 3. Logistics Tables
        content.append(Paragraph("Recommended Hotels", h2_style))
        hotel_table = create_table(data.get("hotels", []), ["Name", "Price/Night", "Rating", "Location"])
        if hotel_table: content.append(hotel_table)

        content.append(Paragraph("Available Flights", h2_style))
        flight_table = create_table(data.get("flights", []), ["Airline", "Price", "Departure", "Duration"])
        if flight_table: content.append(flight_table)

        content.append(Paragraph("Train Options", h2_style))
        train_table = create_table(data.get("trains", []), ["Train Name", "Price", "Departure", "Duration"])
        if train_table: content.append(train_table)

        # 4. Recommendations
        content.append(Paragraph("Pro Tips & Recommendations", h2_style))
        for tip in data.get("recommendations", []):
            content.append(Paragraph(f"• {tip}", styles["Normal"]))

        doc.build(content)
        pdf_bytes = buffer.getvalue()
        
        # AWS S3 Upload Logic
        file_name = f"travel_plan_{uuid.uuid4().hex}.pdf"
        
        try:
            s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=file_name,
                Body=pdf_bytes,
                ContentType='application/pdf'
            )
            
            # Generate Pre-signed URL
            presigned_url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': BUCKET_NAME, 'Key': file_name},
                ExpiresIn=3600 # 1 hour
            )
            
            return JSONResponse(status_code=200, content={"url": presigned_url})
            
        except NoCredentialsError:
            print("❌ AWS Credentials not found! Implement local fallback or check .env.")
            # For local tests without AWS credentials, you can just save to local disk
            with open(file_name, "wb") as f:
                f.write(pdf_bytes)
            return JSONResponse(status_code=500, content={"error": "AWS Credentials Missing. File saved locally successfully.", "local_file": file_name})
            
    except Exception as e:
        print("PDF ERROR:", e)
        return JSONResponse(status_code=500, content={"error": str(e)})
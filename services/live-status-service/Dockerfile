FROM public.ecr.aws/lambda/python:3.10

# Copy requirements and install
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy the application code
COPY main.py .

# Set the CMD to the Mangum handler
CMD ["main.handler"]

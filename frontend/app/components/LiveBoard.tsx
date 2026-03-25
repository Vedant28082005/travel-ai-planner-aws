export default function LiveBoard() {
  const data = [
    { route: "Rajkot → Delhi", price: "₹4,200" },
    { route: "Mumbai → Goa", price: "₹48,200" },
    { route: "Bangalore → Kochi", price: "₹1,850" },
  ];

  return (
    <div style={board}>
      <h3>Live board</h3>

      {data.map((item, i) => (
        <div key={i} style={row}>
          <span>{item.route}</span>
          <span>{item.price}</span>
        </div>
      ))}
    </div>
  );
}

const board = {
  width: "350px",
  background: "rgba(0,0,0,0.6)",
  padding: "20px",
  borderRadius: "10px",
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "10px",
};
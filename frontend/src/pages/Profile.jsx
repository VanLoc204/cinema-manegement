// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import axios from "../api/axios";

export default function Profile() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get("/bookings", {
      headers: {
        Authorization: localStorage.getItem("token"),
      },
    }).then(res => setData(res.data));
  }, []);

  return (
    <div>
      <h2>Lịch sử vé</h2>
      {data.map(b => (
        <div key={b._id}>
          {b.seats.join(", ")}
        </div>
      ))}
    </div>
  );
}
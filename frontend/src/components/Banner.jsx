import { useEffect, useState } from "react";

const images = [
  "https://picsum.photos/1200/400?1",
  "https://picsum.photos/1200/400?2",
  "https://picsum.photos/1200/400?3"
];

export default function Banner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <img
        src={images[index]}
        style={{ width: "100%", height: "400px", objectFit: "cover" }}
      />
    </div>
  );
}
import React from "react";

export default function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
      {children}
    </div>
  );
}

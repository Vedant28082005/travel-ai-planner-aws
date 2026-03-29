'use client'; // Required for useEffect and useState

import { useEffect, useState } from 'react';

export default function StatusBadge() {
  const [status, setStatus] = useState<'Operational' | 'Offline' | 'Loading'>('Loading');

  const getLiveStatus = async () => {
    const url = process.env.NEXT_PUBLIC_LIVE_STATUS_URL;
    if (!url) return { status: "Config Error" };

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Lambda unreachable");
      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Failed to fetch serverless status:", err);
      return { status: "Offline" };
    }
  };

  useEffect(() => {
    getLiveStatus().then((data) => setStatus(data.status));
    
    // Optional: Refresh status every 60 seconds
    const interval = setInterval(() => {
      getLiveStatus().then((data) => setStatus(data.status));
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const color = status === 'Operational' ? '#10b981' : status === 'Loading' ? '#f59e0b' : '#ef4444';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      borderRadius: '20px',
      backgroundColor: `${color}20`,
      border: `1px solid ${color}`,
      width: 'fit-content',
      fontSize: '14px',
      fontWeight: '500',
      color: color
    }}>
      <span style={{
        height: '8px',
        width: '8px',
        borderRadius: '50%',
        backgroundColor: color,
        display: 'inline-block',
        boxShadow: `0 0 8px ${color}`
      }}></span>
      System: {status}
    </div>
  );
}

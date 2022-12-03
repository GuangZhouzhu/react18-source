import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

function FunctionComponent() {
  const [number, setNumber] = useState(0);
  useEffect(() => {
    console.log('useEffect1');
    return () => {
      console.log('destroy useEffect1');
    };
  }, []);
  useEffect(() => {
    console.log('useEffect2');
    return () => {
      console.log('destroy useEffect2');
    };
  }, [number]);
  useEffect(() => {
    console.log('useEffect3');
    return () => {
      console.log('destroy useEffect3');
    };
  });
  return (
    <div
      onClick={() => {
        setNumber(number + 1);
      }}
    >
      {number}
    </div>
  );
}

let element = <FunctionComponent />;

const root = createRoot(document.getElementById('root'));

root.render(element);

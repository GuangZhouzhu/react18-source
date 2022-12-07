import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

function FunctionComponent() {
  console.log('FunctionComponent');
  const [number, setNumber] = useState(0);
  useEffect(() => {
    setNumber((number) => number + 1);
    setNumber((number) => number + 1);
  }, []);
  return (
    <button
      onClick={() => {
        setNumber((number) => number + 1);
        setNumber((number) => number + 1);
      }}
    >
      {number}
    </button>
  );
}

let element = <FunctionComponent />;

const root = createRoot(document.getElementById('root'));

root.render(element);

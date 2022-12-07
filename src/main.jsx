import { useState } from 'react';
import { createRoot } from 'react-dom/client';

function FunctionComponent() {
  const [number, setNumber] = useState(0);
  return (
    <button
      onClick={() => {
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

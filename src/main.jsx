import { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

function FunctionComponent() {
  const [numbers, setNumbers] = useState(new Array(10).fill('A'));
  const divRef = useRef();
  console.log(divRef);
  return (
    <div
      ref={divRef}
      onClick={() => {
        setNumbers((numbers) => numbers.map((item) => item + 'C'));
      }}
    >
      {numbers.map((number, index) => (
        <span key={index}>{number}</span>
      ))}
    </div>
  );
}

let element = <FunctionComponent />;

const root = createRoot(document.getElementById('root'));

root.render(element);

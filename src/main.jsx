import { useState } from 'react';
import { createRoot } from 'react-dom/client';

// hooks样例: userState
function FunctionComponent() {
  const [number1, setNumber1] = useState(0);
  const [number2, setNumber2] = useState(1);
  let attrs = { id: 'btn1' };
  if (number1 === 6) {
    delete attrs.id;
    attrs.style = { color: 'red' };
  }
  return (
    <button
      {...attrs}
      onClick={() => {
        setNumber1(number1 + 1);
        setNumber1((num) => num + 2);
        setNumber1(number1 + 3);
        setNumber2(number2 + 4);
        setNumber2(number2 + 6);
      }}
    >
      {number1}
      {number2}
    </button>
  );
}

let element = <FunctionComponent />;

const root = createRoot(document.getElementById('root'));

root.render(element);

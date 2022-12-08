import { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

let counter = 0;
let timer;
let bCounter = 0;
let cCounter = 0;
function FunctionComponent() {
  const [numbers, setNumbers] = useState(new Array(100).fill('A'));
  const divRef = useRef();
  const updateB = (numbers) => new Array(100).fill(numbers[0] + 'B');
  updateB.id = 'updateB' + bCounter++;
  const updateC = (numbers) => new Array(100).fill(numbers[0] + 'C');
  updateC.id = 'updateC' + cCounter++;
  useEffect(() => {
    timer = setInterval(() => {
      console.log(divRef);
      divRef.current.click();
      if (counter++ === 0) {
        setNumbers(updateB);
      }
      divRef.current.click();
      // 10演示饿死,设置成100则可以演示处理饥饿的效果
      if (counter++ > 100) {
        clearInterval(timer);
      }
    });
  }, []);
  return (
    <div ref={divRef} onClick={() => setNumbers(updateC)}>
      {numbers.map((number, index) => (
        <span key={index}>{number}</span>
      ))}
    </div>
  );
}

let element = <FunctionComponent />;

const root = createRoot(document.getElementById('root'));

root.render(element);

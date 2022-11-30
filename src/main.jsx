import { useState } from 'react';
import { createRoot } from 'react-dom/client';

// // DOM-DIFF样例: 单节点(key相同,类型相同)
// function FunctionComponent() {
//   const [number, setNumber] = useState(0);
//   return number === 0 ? (
//     <div onClick={() => setNumber(number + 1)} key="title" id="title">
//       title
//     </div>
//   ) : (
//     <div onClick={() => setNumber(number + 1)} key="title" id="title2">
//       title2
//     </div>
//   );
// }

// // DOM-DIFF样例: 单节点(key不同,类型相同)
// function FunctionComponent() {
//   const [number, setNumber] = useState(0);
//   return number === 0 ? (
//     <div onClick={() => setNumber(number + 1)} key="title1" id="title">
//       title
//     </div>
//   ) : (
//     <div onClick={() => setNumber(number + 1)} key="title2" id="title2">
//       title2
//     </div>
//   );
// }

// // DOM-DIFF样例: 单节点(key相同,类型不同)
// function FunctionComponent() {
//   const [number, setNumber] = useState(0);
//   return number === 0 ? (
//     <div onClick={() => setNumber(number + 1)} key="title1" id="title1">
//       title1
//     </div>
//   ) : (
//     <p onClick={() => setNumber(number + 1)} key="title1" id="title1">
//       title1
//     </p>
//   );
// }

// DOM-DIFF样例: 原来多个节点,现在只有一个节点
function FunctionComponent() {
  const [number, setNumber] = useState(0);
  return number === 0 ? (
    <ul key="container" onClick={() => setNumber(number + 1)}>
      <li key="A">A</li>
      <li key="B" id="B">
        B
      </li>
      <li key="C">C</li>
    </ul>
  ) : (
    <ul key="container" onClick={() => setNumber(number + 1)}>
      <li key="B" id="B2">
        B2
      </li>
    </ul>
  );
}

let element = <FunctionComponent />;

const root = createRoot(document.getElementById('root'));

root.render(element);

import { useState } from 'react';
import { createRoot } from 'react-dom/client';

// // DOM-DIFF样例-多节点: 数量和key相同,有的type不同
// function FunctionComponent() {
//   console.log('FunctionComponent');
//   const [number, setNumber] = useState(0);
//   return number === 0 ? (
//     <ul key="container" onClick={() => setNumber(number + 1)}>
//       <li key="A">A</li>
//       <li key="B" id="B">
//         B
//       </li>
//       <li key="C" id="C">
//         C
//       </li>
//     </ul>
//   ) : (
//     <ul key="container" onClick={() => setNumber(number + 1)}>
//       <li key="A" id="A2">A2</li>
//       <p key="B" id="B2">
//         B
//       </p>
//       <li key="C" id="C2">
//         C2
//       </li>
//     </ul>
//   );
// }

// // DOM-DIFF样例-多节点: 数量和key相同,type也相同,有新增元素
// function FunctionComponent() {
//   console.log('FunctionComponent');
//   const [number, setNumber] = useState(0);
//   return number === 0 ? (
//     <ul key="container" onClick={() => setNumber(number + 1)}>
//       <li key="A">A</li>
//       <li key="B" id="B">
//         B
//       </li>
//       <li key="C">C</li>
//     </ul>
//   ) : (
//     <ul key="container" onClick={() => setNumber(number + 1)}>
//       <li key="A">A</li>
//       <li key="B" id="B2">
//         B2
//       </li>
//       <li key="C">C2</li>
//       <li key="D">D</li>
//     </ul>
//   );
// }

// // DOM-DIFF样例-多节点: 数量和key相同,type也相同,有删除老元素
// function FunctionComponent() {
//   console.log('FunctionComponent');
//   const [number, setNumber] = useState(0);
//   return number === 0 ? (
//     <ul key="container" onClick={() => setNumber(number + 1)}>
//       <li key="A">A</li>
//       <li key="B" id="B">
//         B
//       </li>
//       <li key="C">C</li>
//     </ul>
//   ) : (
//     <ul key="container" onClick={() => setNumber(number + 1)}>
//       <li key="A">A</li>
//       <li key="B" id="B2">
//         B2
//       </li>
//     </ul>
//   );
// }

// DOM-DIFF样例-多节点: 数量不同,key不同(有增删改移动等多种情况)
function FunctionComponent() {
  console.log('FunctionComponent');
  const [number, setNumber] = useState(0);
  return number === 0 ? (
    <ul key="container" onClick={() => setNumber(number + 1)}>
      <li key="A">A</li>
      <li key="B" id="b">
        B
      </li>
      <li key="C">C</li>
      <li key="D">D</li>
      <li key="E">E</li>
      <li key="F">F</li>
    </ul>
  ) : (
    <ul key="container" onClick={() => setNumber(number + 1)}>
      <li key="A">A2</li>
      <li key="C">C2</li>
      <li key="E">E2</li>
      <li key="B" id="b2">
        B2
      </li>
      <li key="G">G</li>
      <li key="D">D2</li>
    </ul>
  );
}

let element = <FunctionComponent />;

const root = createRoot(document.getElementById('root'));

root.render(element);

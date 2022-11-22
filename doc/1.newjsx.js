const babel = require('@babel/core');
const sourceCode = `
<h1>
    hello<span style={{ color: "red" }}>world</span>
    <div>test</div>
</h1>
`;
const result = babel.transform(sourceCode, {
  plugins: [['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]],
});

console.log(result.code);

// import { jsx as _jsx } from 'react/jsx-runtime';
// import { jsxs as _jsxs } from 'react/jsx-runtime';
// /*#__PURE__*/ _jsxs('h1', {
//   children: [
//     'hello',
//     /*#__PURE__*/ _jsx('span', {
//       style: {
//         color: 'red',
//       },
//       children: 'world',
//     }),
//     /*#__PURE__*/ _jsx('div', {
//       children: 'test',
//     }),
//   ],
// });

/** jsx(type, props)执行,生成后的对象
type ReactElement = {
  $$typeof: REACT_ELEMENT_TYPE,
  type,
  key,
  ref,
  props,// 包含 children,style,id 等
  __self,
  __source
}
 */

/**
 * 1. 如果是原生组件,那么type就是字符串,表示标签名, 比如span,div
 * 2. 如果是函数组件,那么type是函数
 * 3. 如果是类组件,那么type是类(由于js语法特性,编译后也其实也是一个函数)
 */
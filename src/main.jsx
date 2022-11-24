import { useReducer } from 'react';
import { createRoot } from 'react-dom/client';

function reducer(state, action) {
  if (action.type === 'add') {
    return state + action.payload;
  }
  return state;
}

// hooks样例: useReducer
function FunctionComponent() {
  const [number, dispatch] = useReducer(reducer, 0);
  const [number2, dispatch2] = useReducer(reducer, 0);
  return (
    <button
      onClick={() => {
        dispatch({
          type: 'add',
          payload: 1,
        });
        dispatch2({
          type: 'add',
          payload: 2,
        });
      }}
    >
      {number}
      {number2}
    </button>
  );
}

let element = <FunctionComponent />;

const root = createRoot(document.getElementById('root'));

root.render(element);

import { useState, useEffect, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';

function FunctionComponent() {
  const [number, setNumber] = useState(0);
  useEffect(() => {
    console.log('useEffect1');
    return () => {
      console.log('destroy useEffect1');
    };
  });
  useLayoutEffect(() => {
    console.log('useLayoutEffect2');
    return () => {
      console.log('destroy useLayoutEffect2');
    };
  });
  useEffect(() => {
    console.log('useEffect3');
    return () => {
      console.log('destroy useEffect3');
    };
  });
  useLayoutEffect(() => {
    console.log('useLayoutEffect4');
    return () => {
      console.log('destroy useLayoutEffect4');
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

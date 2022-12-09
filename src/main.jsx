import { useState, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';

const NameContext = createContext('');
const AgeContext = createContext('');

function Child() {
  const name = useContext(NameContext);
  const age = useContext(AgeContext);
  return <button>{name + age}</button>;
}
function App() {
  const [name, setName] = useState('a');
  const [age, setAge] = useState('1');
  return (
    <div>
      <button
        onClick={() => {
          setName(name + 'a');
        }}
      >
        setName
      </button>
      <button
        onClick={() => {
          setAge(age + '1');
        }}
      >
        setAge
      </button>
      <NameContext.Provider value={name}>
        <AgeContext.Provider value={age}>
          <Child />
        </AgeContext.Provider>
      </NameContext.Provider>
    </div>
  );
}

let element = <App />;

const root = createRoot(document.getElementById('root'));

root.render(element);

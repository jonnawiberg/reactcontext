import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useRef,
  useCallback,
  useSyncExternalStore,
} from "react";

//Define the initial state of the store
type Store = { first: string; last: string };

//Create a function where all data is handled for the store
function useStoreData(): {
  get: () => Store;
  set: (value: Partial<Store>) => void;
  subscribe: (callback: () => void) => () => void;
} {
  const store = useRef({
    first: "",
    last: "",
  });

  //Getter function
  const get = useCallback(() => store.current, []);

  //Set of subscribers
  const subscribers = useRef(new Set<() => void>());

  //Setter function
  const set = useCallback((value: Partial<Store>) => {
    store.current = { ...store.current, ...value };
    subscribers.current.forEach((callback) => callback());
  }, []);

  //Subscribe function
  const subscribe = useCallback((callback: () => void) => {
    subscribers.current.add(callback);
    return () => subscribers.current.delete(callback);
  }, []);

  return {
    get,
    set,
    subscribe,
  };
}

//Cool thing about typescript where you can create a type
//based on the return type of a function
type UseStoreDataReturnType = ReturnType<typeof useStoreData>;

//Create context
const StoreContext = createContext<null | UseStoreDataReturnType>(null);

//Create provider
function Provider({ children }: { children: React.ReactNode }) {
  return (
    <StoreContext.Provider value={useStoreData()}>
      {children}
    </StoreContext.Provider>
  );
}

//Create a hook to access the store
function useStore<SelectorOutput>(
  selector: (store: Store) => SelectorOutput
): [SelectorOutput, (value: Partial<Store>) => void] {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("Store not found");
  }

  //Pre react 18 you had to use usestate combined with useeffect to subscribe to the store.
  //With React 18 you can use a new hook for this called useSyncExternalStore

  // const [state, setState] = useState(store.get());

  // useEffect(() => {
  //   return store.subscribes() => setState(store.get()));
  // }, []);

  //React 18 magic useSyncExternalStore
  const state = useSyncExternalStore(store.subscribe, () =>
    selector(store.get())
  );

  return [state, store.set];
}

const TextInput = ({ value }: { value: "first" | "last" }) => {
  //Access the store and only set the value that is needed in the store
  //Instead of the full store, so we wont trigger any unnessesary rerenders
  const [fieldValue, setStore] = useStore((store) => store[value]);
  return (
    <div className="field">
      {value}:{" "}
      <input
        value={fieldValue}
        onChange={(e) => setStore({ [value]: e.target.value })}
      />
    </div>
  );
};

const Display = ({ value }: { value: "first" | "last" }) => {
  const [fieldValue] = useStore((store) => store[value]);
  return (
    <div className="value">
      {value}: {fieldValue}
    </div>
  );
};

const FormContainer = () => {
  return (
    <div className="container">
      <h5>FormContainer</h5>
      <TextInput value="first" />
      <TextInput value="last" />
    </div>
  );
};

const DisplayContainer = () => {
  return (
    <div className="container">
      <h5>DisplayContainer</h5>
      <Display value="first" />
      <Display value="last" />
    </div>
  );
};

const ContentContainer = () => {
  return (
    <div className="container">
      <h5>ContentContainer</h5>
      <FormContainer />
      <DisplayContainer />
    </div>
  );
};

function App() {
  return (
    <Provider>
      <div className="container">
        <h5>App</h5>
        <ContentContainer />
      </div>
    </Provider>
  );
}

export default App;

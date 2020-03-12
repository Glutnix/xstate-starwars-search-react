import React from "react";
import { Machine, assign } from "xstate";
import { useMachine } from "@xstate/react";
import "./styles.css";

const searchStarWarsPeople = search =>
  fetch(`https://swapi.co/api/people/?search=${search}`).then(response =>
    response.json()
  );

const searchMachine = Machine(
  {
    id: "searchMachine",
    context: {
      search: "",
      result: {},
      error: {}
    },
    initial: "blank",
    states: {
      blank: {
        entry: "captureSearch"
      },
      debouncing: {
        entry: "captureSearch",
        after: {
          300: "searching"
        }
      },
      searching: {
        invoke: {
          id: "doSearch",
          src: "fetchResults",
          onDone: {
            target: "searchSuccess",
            actions: "captureResult"
          },
          onError: {
            target: "searchFailure",
            actions: "captureError"
          }
        }
      },
      searchSuccess: {
        on: {
          "": [
            {
              cond: "resultsEmpty",
              target: "searchNoResults"
            },
            {
              target: "searchResults"
            }
          ]
        }
      },
      searchResults: {},
      searchNoResults: {},
      searchFailure: {}
    },
    on: {
      SEARCH_CHANGED: [
        {
          cond: "searchIsEmpty",
          target: "blank"
        },
        {
          target: "debouncing"
        }
      ]
    }
  },
  {
    actions: {
      captureSearch: assign((_ctx, evt) => {
        return { search: evt.search };
      }),
      captureResult: assign({ result: (_ctx, evt) => evt.data }),
      captureError: assign({ error: (_ctx, evt) => evt.data })
    },
    guards: {
      searchIsEmpty: (_ctx, evt) => {
        return !evt.search || evt.search.length === 0;
      },
      resultsEmpty: (ctx, _evt) => {
        return ctx.result.count === 0;
      }
    },
    services: {
      fetchResults: (ctx, _evt) => searchStarWarsPeople(ctx.search)
    }
  }
);

export default function App() {
  const [current, send] = useMachine(searchMachine);

  return (
    <div className="App">
      <div className="Form">
        <h1>Search Star Wars API with XState and React</h1>
        <p>
          Current State: <code>{JSON.stringify(current.value)}</code>
        </p>
        <div className="form-group">
          <label htmlFor="search">Search:</label>
          <input
            id="search"
            type="text"
            className={[!current.matches("blank") && "has-text"]}
            onChange={e => {
              send("SEARCH_CHANGED", { search: e.target.value });
            }}
            value={current.context.search}
          />
          <p>
            Try <kbd>chew</kbd> or <kbd>sky</kbd> or <kbd>none</kbd>
          </p>
        </div>
      </div>

      {current.matches("searching") && (
        <h2>Searching for {current.context.search} ...</h2>
      )}

      {current.matches("searchResults") && (
        <div>
          <strong>
            {current.context.result.results.length} records found.
          </strong>
          <ul>
            {current.context.result.results.map(result => (
              <li key={result.toString()}>
                <h2>{result.name}</h2>
                <p>
                  {result.gender}, {result.height}cm, {result.mass}kg,{" "}
                  {result.hair_color} and {result.skin_color}. Features in{" "}
                  {result.films.length}{" "}
                  {result.films.length === 1 ? "film" : "films"}
                </p>
                {/* <code>{JSON.stringify(result)}</code> */}
              </li>
            ))}
          </ul>
        </div>
      )}

      {current.matches("searchNoResults") && (
        <h2>
          Sorry, no <code>{current.context.search}</code> was found.
        </h2>
      )}

      {current.matches("searchFailure") && (
        <pre>{JSON.stringify(current.context.error)}</pre>
      )}

      <hr />

      <p>
        <a href="https://github.com/Glutnix/xstate-starwars-search-react">
          Fork the latest of this on GitHub
        </a>
        {} or {}
        <a href="https://codesandbox.io/s/github/Glutnix/xstate-starwars-search-react/tree/master/">
          Fork the latest on CodeSandbox
        </a>
      </p>
      <p>
        <a href="https://xstate.js.org/viz/?gist=f372e3732e2dd023a32988993685fb65">
          See the state machine diagram in XState Visualizer
          <br />
          <img
            src="../assets/xstate-viz.png"
            alt=""
            style={{ width: "200px", border: "1px solid black" }}
          />
        </a>
      </p>
    </div>
  );
}

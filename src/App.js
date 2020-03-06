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
      <pre>{JSON.stringify(current.value)}</pre>
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
          Try <kbd>chew</kbd> or <kbd>luke</kbd> or <kbd>none</kbd>
        </p>
      </div>

      {current.matches("searching") && (
        <h2>Searching for {current.context.search} ...</h2>
      )}

      {current.matches("searchResults") && (
        <h2>{current.context.result.results[0].name}</h2>
      )}
      {current.matches("searchNoResults") && (
        <h2>
          Sorry, no <code>{current.context.search}</code> was found.
        </h2>
      )}
      {current.matches("searchSuccess") && (
        <div>
          <pre>{JSON.stringify(current.context.result.results[0])}</pre>
        </div>
      )}

      {current.matches("searchFailure") && (
        <pre>{JSON.stringify(current.context.error)}</pre>
      )}
    </div>
  );
}

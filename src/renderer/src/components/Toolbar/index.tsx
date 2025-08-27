import React, { useContext, useCallback, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { AppState } from '../../types';
import Icon from '../Icon';
import './style.css';

const getGraphTitle = (state: AppState, graphId: string): string => {
  if (state.history.length > 0 && graphId === state.history[0]) return 'Home';

  for (const g of Object.values(state.graphs)) {
    const node = g.nodes.find((n) => n.data.subgraphId === graphId);
    if (node) {
      return node.data.title;
    }
  }
  return 'Sconosciuto';
};

const Toolbar: React.FC = () => {
  const { setState, state, addNodeAndEdge, navigateToHistory } = useContext(AppContext);

  const handleBack = useCallback(() => {
    navigateToHistory(state.history.length - 2);
  }, [navigateToHistory, state.history.length]);

  const handleSave = useCallback(() => {
    console.log('SAVING STATE:', state);
    const dataToSave = JSON.stringify(state, null, 2);
    window.api.saveData(dataToSave);
  }, [state]);

  const handleLoad = useCallback(() => {
    window.api.loadData();
  }, []);

  useEffect(() => {
    const handleDataLoaded = (data: string) => {
      console.log('----- DATA LOADED FROM FILE -----');
      try {
        const loadedState: AppState = JSON.parse(data);
        console.log('PARSED STATE:', loadedState);
        console.log('Subgraphs in loaded state:', Object.keys(loadedState.graphs));

        // Sostituisce lo stato esistente con quello caricato
        setState(loadedState);

        console.log('----- NEW STATE SET -----');
      } catch (err) {
        console.error('Errore nel parsing dei dati caricati:', err);
      }
    };

    // Aggiungi un controllo per window.api
    if (window.api) {
      window.api.onDataLoaded(handleDataLoaded);

      return () => {
        window.api.removeDataLoadedListener();
      };
    }
  }, [setState]);

  return (
    <div className="toolbar-container">
      <div className="toolbar-group">
        <button
          onClick={handleBack}
          disabled={state.history.length <= 1}
          title="Indietro"
        >
          <Icon name="back" />
        </button>
        <button onClick={addNodeAndEdge}>Aggiungi Argomento</button>
      </div>
      <div className="spacer"></div>
      <div className="graph-path">
        {state.history.map((graphId, index) => (
          <React.Fragment key={graphId}>
            <button
              className="breadcrumb-button"
              onClick={() => navigateToHistory(index)}
              disabled={index === state.history.length - 1}
            >
              {getGraphTitle(state, graphId)}
            </button>
            {index < state.history.length - 1 && (
              <span className="breadcrumb-separator">/</span>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="spacer"></div>
      <div className="toolbar-group">
        <button onClick={handleSave} title="Salva">
          <Icon name="save" />
        </button>
        <button onClick={handleLoad} title="Carica">
          <Icon name="load" />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;

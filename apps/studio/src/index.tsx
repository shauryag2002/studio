import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider as ModalsProvider } from '@ebay/nice-modal-react';
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { BrowserRouter as Router } from 'react-router-dom';
import { createServices, ServicesProvider } from './services';
import { App } from './App';

import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';
import '@asyncapi/react-component/styles/default.min.css';
import 'reactflow/dist/style.css';
import './tailwind.css';
import './main.css';

function configureMonacoEnvironment() {
  window.MonacoEnvironment = {
    getWorker(_, label) {
      switch (label) {
      case 'editorWorkerService':
        return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url));
      case 'json':
        return new Worker(
          new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url),
        );
      case 'yaml':
      case 'yml':
        return new Worker(new URL('monaco-yaml/yaml.worker', import.meta.url));
      default:
        throw new Error(`Unknown worker ${label}`);
      }
    },
  };
}
async function bootstrap() {
  configureMonacoEnvironment();
  const services = await createServices();

  const root = createRoot(
    document.getElementById('root') as HTMLElement,
  );
  const domain = 'localhost:8081/graphql';
  const httpLink = new HttpLink({
    uri: `http://${domain}`,
  });
  const wsLink = new GraphQLWsLink(createClient({
    url: `ws://${domain}`,
  }));
  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wsLink,
    httpLink,
  );
  const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
  });

  root.render(
    <Router>
      <StrictMode>
        <ServicesProvider value={services}>
          <ModalsProvider>
            <ApolloProvider client={client}>
              <App />
            </ApolloProvider>
          </ModalsProvider>
        </ServicesProvider>
      </StrictMode>
    </Router>
  );
}

bootstrap().catch(console.error);

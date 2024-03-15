import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import { createServer } from 'http';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { PubSub } from 'graphql-subscriptions';
import { v4 as uuidv4 } from 'uuid';
import bodyParser from 'body-parser';
import cors from 'cors';
const PORT = 8081;
const pubsub = new PubSub();
const typeDefs = `#graphql
type Message {
    id: ID!
    user: String!
    content: String!
    roomId: ID!
    color: String
  }

  type Room {
    id: ID!
    messages: [Message!]
    versions: [String!]
  }
  type Query {
    rooms: [Room!]
    room(id: ID!): Room
  }
  type Query {
    versions(roomId: ID!): [String!]
  }
  type Mutation {
    createVersion(roomId: ID!, version: String!): String!
  }
  type Mutation {
    postMessage(user: String!, content: String!, roomId: ID!,color: String!): MessageResponse!
    createRoom: ID!
  }

  type Subscription {
    room(id: ID!): Room
    messageAdded(roomId: ID!): Message
    versions(roomId: ID!): String
  }

  type MessageResponse {
    error: Boolean!
    message: Message
    errorType: String
    id: ID
  }
`;
interface RoomsType {
  id: string;
  messages: MessageType[];
  versions: string[];
}
interface MessageType {
  id?: number;
  user?: string;
  content?: string;
  roomId?: string;
  color?: string;
}
const messages: MessageType[] = [];
const rooms: RoomsType[] = [];
const resolvers = {
  Query: {
    rooms: () => rooms,
    room: (parent: any, { id }: { id: string }) => rooms.find((room: RoomsType) => room.id === id),
    versions: (parent: any, { roomId }: { roomId: string }) => {
      const room = rooms.find(room => room.id === roomId);
      if (!room) {
        return [];
      }
      return room.versions;
    }
  },
  Mutation: {
    postMessage: (_: any, { user, content, roomId, color }: MessageType) => {
      const room = rooms.find(room => room.id === roomId);
      if (!room) {
        return {
          error: true,
          errorType: 'Room not found',
        };
      }
      const id = messages.length + 1;
      const message: MessageType = {
        id,
        user,
        content,
        roomId,
        color,
      };
      room.messages.push(message);
      messages.push(message);
      pubsub.publish(`MESSAGE_ADDED_${roomId}`, { messageAdded: message });
      return {
        id,
        message
      };
    },
    createRoom: () => {
      const id = uuidv4(); // Ensure id is a string
      const room = {
        id,
        messages: [],
        versions: [],
      };
      rooms.push(room);
      pubsub.publish(`ROOM_ADDED_${id}`, { roomAdded: room });
      return id;
    },
    createVersion: (_: any, { roomId, version }: { roomId: string; version: string }) => {
      const room = rooms.find(room => room.id === roomId);
      if (!room) {
        return 'Room not found';
      }
      const versions = room.versions || [];
      room.versions = [version, ...versions];
      pubsub.publish(`VERSION_ADDED_${roomId}`, { versionAdded: version });
      return version;
    },
  },
  Subscription: {
    room: {
      subscribe: (_: any, { id }: { id: string }) => {
        return pubsub.asyncIterator(`ROOM_ADDED_${id}`);
      },
    },
    messageAdded: {
      subscribe: (_: any, { roomId }: { roomId: string }) => {
        return pubsub.asyncIterator(`MESSAGE_ADDED_${roomId}`);
      },
    },
    versions: {
      subscribe: (_: any, { roomId }: { roomId: string }) => {
        return pubsub.asyncIterator(`VERSION_ADDED_${roomId}`);
      },
      resolve: (payload: any) => {
        // payload contains the data published by the pubsub
        // In this case, it's the latest version added to the room
        return payload.versionAdded;
      }
    },
  },
  Room: {
    messages: (room: RoomsType) => messages.filter(message => message.roomId === room.id),
  },
}
const schema = makeExecutableSchema({ typeDefs, resolvers });
const app = express();
const httpServer = createServer(app);
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});
const serverCleanup = useServer({ schema }, wsServer);
const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});
app.use(cors())
async function serverStart() {
  await server.start();
  app.use('/graphql', cors<cors.CorsRequest>(), bodyParser.json(), expressMiddleware(server));
  httpServer.listen(PORT, () => {
    console.log(`🚀 Query endpoint ready at http://localhost:${PORT}/graphql`);
    console.log(`🚀 Subscription endpoint ready at ws://localhost:${PORT}/graphql`);
  });
}
serverStart();
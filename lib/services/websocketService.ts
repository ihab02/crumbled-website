import { EventEmitter } from 'events';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  kitchenId?: number;
  userId?: number;
}

export interface WebSocketConnection {
  id: string;
  userId: number;
  kitchenId: number;
  socket: any;
  isAlive: boolean;
  lastPing: number;
}

export class WebSocketService extends EventEmitter {
  private connections: Map<string, WebSocketConnection> = new Map();
  private kitchenRooms: Map<number, Set<string>> = new Map();
  private userConnections: Map<number, Set<string>> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startPingInterval();
    this.startCleanupInterval();
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(socket: any, userId: number, kitchenId: number): string {
    const connectionId = this.generateConnectionId();
    
    const connection: WebSocketConnection = {
      id: connectionId,
      userId,
      kitchenId,
      socket,
      isAlive: true,
      lastPing: Date.now()
    };

    // Store connection
    this.connections.set(connectionId, connection);

    // Add to kitchen room
    if (!this.kitchenRooms.has(kitchenId)) {
      this.kitchenRooms.set(kitchenId, new Set());
    }
    this.kitchenRooms.get(kitchenId)!.add(connectionId);

    // Add to user connections
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);

    // Set up socket event handlers
    socket.on('message', (data: any) => this.handleMessage(connectionId, data));
    socket.on('close', () => this.handleDisconnection(connectionId));
    socket.on('error', (error: any) => this.handleError(connectionId, error));
    socket.on('pong', () => this.handlePong(connectionId));

    // Send welcome message
    this.sendToConnection(connectionId, {
      type: 'connection_established',
      data: { connectionId, kitchenId, userId },
      timestamp: Date.now()
    });

    console.log(`[WebSocket] New connection: ${connectionId} (User: ${userId}, Kitchen: ${kitchenId})`);
    
    return connectionId;
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(connectionId: string, data: any) {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      const connection = this.connections.get(connectionId);
      
      if (!connection) {
        console.warn(`[WebSocket] Message from unknown connection: ${connectionId}`);
        return;
      }

      // Update last activity
      connection.lastPing = Date.now();
      connection.isAlive = true;

      // Emit message event
      this.emit('message', {
        connectionId,
        userId: connection.userId,
        kitchenId: connection.kitchenId,
        message
      });

      console.log(`[WebSocket] Message from ${connectionId}: ${message.type}`);
    } catch (error) {
      console.error(`[WebSocket] Error parsing message from ${connectionId}:`, error);
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnection(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Remove from kitchen room
    const kitchenRoom = this.kitchenRooms.get(connection.kitchenId);
    if (kitchenRoom) {
      kitchenRoom.delete(connectionId);
      if (kitchenRoom.size === 0) {
        this.kitchenRooms.delete(connection.kitchenId);
      }
    }

    // Remove from user connections
    const userConnections = this.userConnections.get(connection.userId);
    if (userConnections) {
      userConnections.delete(connectionId);
      if (userConnections.size === 0) {
        this.userConnections.delete(connection.userId);
      }
    }

    // Remove connection
    this.connections.delete(connectionId);

    console.log(`[WebSocket] Connection closed: ${connectionId}`);
  }

  /**
   * Handle WebSocket error
   */
  private handleError(connectionId: string, error: any) {
    console.error(`[WebSocket] Error on connection ${connectionId}:`, error);
    this.handleDisconnection(connectionId);
  }

  /**
   * Handle pong response
   */
  private handlePong(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.isAlive = true;
      connection.lastPing = Date.now();
    }
  }

  /**
   * Send message to specific connection
   */
  sendToConnection(connectionId: string, message: WebSocketMessage): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      console.warn(`[WebSocket] Connection not found: ${connectionId}`);
      return false;
    }

    try {
      connection.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`[WebSocket] Error sending to ${connectionId}:`, error);
      this.handleDisconnection(connectionId);
      return false;
    }
  }

  /**
   * Send message to all connections in a kitchen
   */
  sendToKitchen(kitchenId: number, message: WebSocketMessage): number {
    const kitchenRoom = this.kitchenRooms.get(kitchenId);
    if (!kitchenRoom) return 0;

    let sentCount = 0;
    const deadConnections: string[] = [];

    for (const connectionId of kitchenRoom) {
      if (this.sendToConnection(connectionId, message)) {
        sentCount++;
      } else {
        deadConnections.push(connectionId);
      }
    }

    // Clean up dead connections
    deadConnections.forEach(id => this.handleDisconnection(id));

    console.log(`[WebSocket] Sent to kitchen ${kitchenId}: ${sentCount} connections`);
    return sentCount;
  }

  /**
   * Send message to specific user across all their connections
   */
  sendToUser(userId: number, message: WebSocketMessage): number {
    const userConnections = this.userConnections.get(userId);
    if (!userConnections) return 0;

    let sentCount = 0;
    const deadConnections: string[] = [];

    for (const connectionId of userConnections) {
      if (this.sendToConnection(connectionId, message)) {
        sentCount++;
      } else {
        deadConnections.push(connectionId);
      }
    }

    // Clean up dead connections
    deadConnections.forEach(id => this.handleDisconnection(id));

    console.log(`[WebSocket] Sent to user ${userId}: ${sentCount} connections`);
    return sentCount;
  }

  /**
   * Broadcast message to all connections
   */
  broadcast(message: WebSocketMessage): number {
    let sentCount = 0;
    const deadConnections: string[] = [];

    for (const [connectionId, connection] of this.connections) {
      if (this.sendToConnection(connectionId, message)) {
        sentCount++;
      } else {
        deadConnections.push(connectionId);
      }
    }

    // Clean up dead connections
    deadConnections.forEach(id => this.handleDisconnection(id));

    console.log(`[WebSocket] Broadcast sent: ${sentCount} connections`);
    return sentCount;
  }

  /**
   * Send order update to kitchen
   */
  sendOrderUpdate(kitchenId: number, orderData: any): number {
    return this.sendToKitchen(kitchenId, {
      type: 'order_update',
      data: orderData,
      timestamp: Date.now(),
      kitchenId
    });
  }

  /**
   * Send batch update to kitchen
   */
  sendBatchUpdate(kitchenId: number, batchData: any): number {
    return this.sendToKitchen(kitchenId, {
      type: 'batch_update',
      data: batchData,
      timestamp: Date.now(),
      kitchenId
    });
  }

  /**
   * Send notification to user
   */
  sendNotification(userId: number, notificationData: any): number {
    return this.sendToUser(userId, {
      type: 'notification',
      data: notificationData,
      timestamp: Date.now(),
      userId
    });
  }

  /**
   * Send kitchen capacity update
   */
  sendCapacityUpdate(kitchenId: number, capacityData: any): number {
    return this.sendToKitchen(kitchenId, {
      type: 'capacity_update',
      data: capacityData,
      timestamp: Date.now(),
      kitchenId
    });
  }

  /**
   * Start ping interval to keep connections alive
   */
  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      const deadConnections: string[] = [];

      for (const [connectionId, connection] of this.connections) {
        // Send ping if connection hasn't been active for 30 seconds
        if (now - connection.lastPing > 30000) {
          try {
            connection.socket.ping();
          } catch (error) {
            deadConnections.push(connectionId);
          }
        }

        // Mark as dead if no pong received for 60 seconds
        if (now - connection.lastPing > 60000) {
          deadConnections.push(connectionId);
        }
      }

      // Clean up dead connections
      deadConnections.forEach(id => this.handleDisconnection(id));
    }, 30000); // Check every 30 seconds
  }

  /**
   * Start cleanup interval for orphaned connections
   */
  private startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const deadConnections: string[] = [];

      for (const [connectionId, connection] of this.connections) {
        // Remove connections that haven't responded for 5 minutes
        if (now - connection.lastPing > 300000) {
          deadConnections.push(connectionId);
        }
      }

      deadConnections.forEach(id => this.handleDisconnection(id));
    }, 60000); // Check every minute
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.connections.size,
      kitchenRooms: this.kitchenRooms.size,
      userConnections: this.userConnections.size,
      connectionsByKitchen: Object.fromEntries(
        Array.from(this.kitchenRooms.entries()).map(([kitchenId, connections]) => [
          kitchenId,
          connections.size
        ])
      )
    };
  }

  /**
   * Cleanup on shutdown
   */
  destroy() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Close all connections
    for (const [connectionId, connection] of this.connections) {
      try {
        connection.socket.close();
      } catch (error) {
        console.error(`[WebSocket] Error closing connection ${connectionId}:`, error);
      }
    }

    this.connections.clear();
    this.kitchenRooms.clear();
    this.userConnections.clear();
  }
}

// Export singleton instance
export const websocketService = new WebSocketService(); 
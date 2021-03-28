import { constants } from './constants.js';

export default class EventManager {
  #allusers = new Map();
  constructor({ componentEmitter, socketClient }) {
    this.componentEmitter = componentEmitter;
    this.socketClient = socketClient;
  }

  joinRoomAndWaitForMessages(data) {
    this.socketClient.sendMessage(constants.events.socket.JOIN_ROOM, data);

    this.componentEmitter.on(constants.events.app.MESSAGE_SENT, msg => {
      this.socketClient.sendMessage(constants.events.socket.MESSAGE, msg);
    });
  }

  updateUsers(users) {
    const connectedUsers = users;
    connectedUsers.forEach(({ id, userName }) =>
      this.#allusers.set(id, userName)
    );
    this.#updateUsersComponent();
  }

  message(message) {
    this.componentEmitter.emit(constants.events.app.MESSAGE_RECEIVED, message);
  }

  disconnectUser(user) {
    const { userName, id } = user;
    this.#allusers.delete(id);

    this.#updateActivityLogComponent(`${userName} left`);
    this.#updateUsersComponent();
  }

  newUserConnected(message) {
    const user = message;
    this.#allusers.set(user.id, user.userName);
    this.#updateUsersComponent();
    this.#updateActivityLogComponent(`${user.userName} joined!`);
  }

  #updateActivityLogComponent(message) {
    this.#emitComponentUpdate(
      constants.events.app.ACTIVITYLOG_UPDATED,
      message
    );
  }

  #emitComponentUpdate(event, message) {
    this.componentEmitter.emit(event, message);
  }

  #updateUsersComponent() {
    this.#emitComponentUpdate(
      constants.events.app.STATUS_UPDATED,
      Array.from(this.#allusers.values())
    );
  }

  getEvents() {
    const functions = Reflect.ownKeys(EventManager.prototype)
      .filter(fn => fn !== 'constructor')
      .map(name => [name, this[name].bind(this)]);

    return new Map(functions);
  }
}

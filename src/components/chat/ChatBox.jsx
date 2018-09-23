import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Message, Sidebar, Card, Input, Header } from "semantic-ui-react";
import io from "socket.io-client"

import ChatService from "./ChatService";

class ChatBox extends Component {
  constructor(props) {
    super(props);

    this.state = {
      message: "",
      messages: []
    };

    this.inputRef = null;
    this.socket = null
    this.service = new ChatService();

    this.handleMessageChange = this.handleMessageChange.bind(this);
    this.handleMessageSubmit = this.handleMessageSubmit.bind(this);
    this.handleEnterKey = this.handleEnterKey.bind(this);
    this.setInputRef = this.setInputRef.bind(this);
    this.scrollInputIntoView = this.scrollInputIntoView.bind(this);
    this.makeMessage = this.makeMessage.bind(this);
    this.addMessages = this.addMessages.bind(this);
    this.sortMessageByTimestamp = this.sortMessageByTimestamp.bind(this);
  }

  handleMessageChange(event) {
    event.preventDefault();
    this.setState({message: event.target.value});
  }

  handleMessageSubmit(event) {
    event.preventDefault();
    console.log("submit: " + this.state.message);

    this.socket.emit("publish", {author: "david", data: this.state.message});
    this.setState({message: ""});
  }

  handleEnterKey(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      this.handleMessageSubmit(event);
    }
  }

  setInputRef(ref) {
    this.inputRef = ref;
  }

  scrollInputIntoView() {
    if (this.inputRef) {
      const inputNode = ReactDOM.findDOMNode(this.inputRef);
      inputNode.scrollIntoView();
    } else {
      console.log("input ref was not initialized :(");
    }
  }

  makeMessage(message, index) {
    return (
      <Card key={message.timestamp}
            header={message.author}
            meta={new Date(message.timestamp).toTimeString()}
            description={message.data}/>
    );
  }

  componentDidUpdate(prevProps) {
    if (prevProps.visible !== this.props.visible && this.props.visible) {
      console.log("component is visible...scrolling")
      this.scrollInputIntoView();
    }
  }

  componentDidMount() {
    this.socket = io("localhost:8081");
    this.socket.on("messages", (message) => {
      console.log(`received message: ${JSON.stringify(message)}`);
      this.addMessages([message]);
    });

    this.service.getMessagesBefore(Date.now())
      .then((messagesResponse) => messagesResponse.data)
      .then((messages) => this.addMessages(messages));
  }

  addMessages(messages) {
    const stateMessages = this.state.messages;
    this.setState({messages: stateMessages.concat(messages).sort(this.sortMessageByTimestamp)});
  }

  sortMessageByTimestamp(m1, m2) {
    return m1.timestamp - m2.timestamp;
  }


  componentWillUnmount() {
    this.socket.disconnect();
    this.socket = null;
  }

  render() {
    return (
      <Sidebar as={Card}
               animation="push"
               visible={this.props.visible}
               direction="right"
               width="very wide">

        <Card.Header as={Header}
                     style={{marginTop: "10px"}}
                     textAlign="center"
                     content="Major Key Chat Room"/>
        <Card.Content>
          <Card.Description>
            <Card.Group>
              {this.state.messages.map(this.makeMessage)}
            </Card.Group>
          </Card.Description>
        </Card.Content>
        <Card.Content extra>
          <Input placeholder="Type a message..."
                 fluid
                 value={this.state.message} 
                 onChange={this.handleMessageChange}
                 onSubmit={this.handleMessageSubmit}
                 onKeyDown={this.handleEnterKey}
                 ref={this.setInputRef}/>
        </Card.Content>
      </Sidebar>
    );
  }
}

export default ChatBox;

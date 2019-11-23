import React, { Component } from "react";
import Bookingapi from "../utils/BookingAPI";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Ownerbooking from "../components/BookingCard/ownerbooking";

class OwnerBooking extends Component {
  state = {
    workspaces: []
  };

  componentDidMount() {
    this.loadWorkspaces();
  }

  loadWorkspaces = () => {
    Bookingapi.getUserDetails(localStorage.getItem("UserId")).then(res => {
      this.setState({
        workspaces: res.data
      });
    });
  };

  handleFormSearch = event => {
    event.preventDefault();
  };

  handleFeatureSelect = event => {};

  render() {
    return (
      <Container>
        <Row>
          <Col md="12" sm="12">
            {this.state.workspaces.map(workspace => {
              return (
                <Ownerbooking
                  rowStyle="row no-gutters"
                  imgStyle="col-md-1"
                  bodyStyle="col-md-2"
                  {...workspace.User}
                  {...workspace.Workspace}
                  {...workspace.Workspace.WorkspacePics[0]}
                  {...workspace}
                />
              );
            })}
          </Col>
        </Row>
      </Container>
    );
  }
}

export default OwnerBooking;

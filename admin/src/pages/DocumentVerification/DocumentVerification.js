import React, { useEffect, useState, useRef, useCallback } from "react";
import _ from "lodash";
import {
  Nav,
  Tab
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";

import SideBar from "../sideBar/sidebar.js";
import {
    getUserList, getUserStatusCounter
} from "../pageContainer/action";
import PageHeader from "../pageContainer/header";
import UserTable from "./UserTable";
import Utils from "../../utility/index.js";
import { NavItemSet } from "../pageContainer/Component";
import { Navigate } from "react-router-dom";

function DocumentVerificationPage() {
  const dispatch = useDispatch();
  const [endUser, setEndUser] = useState('');
  const [status, setStatus] = useState(11);
  const [page, setPage] = useState(2);
  const { pagination, search, usersAdminStatus, loading } = useSelector(
    (state) => state.userListReducer
  );
  useEffect(() => {
    dispatch(getUserStatusCounter());
    dispatch({
      type: Utils.ActionName.USER_LIST,
      payload: { tab: 1, search: "", per_page: 10, userlist: [] }
    });
    dispatch(getUserList(11, 1));
  }, []);


  const observer = useRef();
  const lastPostElementRef = useCallback(node => {
    if(loading) return;
    if(observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if(entries[0].isIntersecting && pagination.total_pages >= page) {
        dispatch(getUserList(status, page));
        setPage(page+1);
      }
      else {
        setEndUser("End of page");
      }
    });
    if(node) observer.current.observe(node);
  });
  const token = localStorage.getItem("accessToken");
  if(!token) {
    return <Navigate to="/" replace={true} />;
  }
  return (
    <div className="dashboardUi">
      <SideBar />
      <div className="inner-page userListUI">
        <PageHeader title="Document Verification" />
        <Tab.Container defaultActiveKey="link-1">
          <Nav variant="tabs">
            <NavItemSet
              eventKey="link-1"
              status=""
              badge={usersAdminStatus?.document_uploaded}
              // setStatus={}
              title="Total Users"
              payload={{ tab: 1, search: "", per_page: 10, userlist: [] }}
              getFunc={getUserList}
            />
            {/* <Button
              variant="primary"
              onClick={() => {
                handleModal();
                setType("");
              }}
              className="ml-auto createNewBtn"
            >
              Create new
            </Button> */}
          </Nav>
          <Tab.Content className="influencersContent">
            <Tab.Pane eventKey="link-1">
            {status === 11 ? <UserTable endUser={endUser} lastPostElementRef={lastPostElementRef} status={status}/> : null}
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </div>
    </div>
  );
}

export default DocumentVerificationPage;

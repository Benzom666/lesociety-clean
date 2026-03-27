import React from "react";
import App, { Container } from "next/app";
import Head from "next/head";
import { Provider } from "react-redux";
import withRedux from "next-redux-wrapper";
import withReduxSaga from "next-redux-saga";
import createStore from "engine";
import "bootstrap/dist/css/bootstrap.css";
import "react-rangeslider/lib/index.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  loadFromLocalStorage,
  removeSessionStorage,
} from "utils/sessionStorage";
import { useDispatch, useSelector } from "react-redux";

import Router from "next/router";
import Loader from "@/modules/Loader/Loader";
import io from "socket.io-client";

import "styles/style.scss";
import "styles/main.scss";
import "styles/membership.scss";
import "styles/sidebar-tokens.css";
import "styles/messages.css";
import "modules/date/create-date.broken/styles/mobile.css";
import "modules/date/create-date.broken/styles/desktop.css";
import { removeCookie } from "utils/cookie";
import LanscapeDecline from "@/core/LanscapeDecline";
import { apiRequest, socketURL } from "utils/Utilities";
import { getActiveDateCount } from "utils/dateState";
import { AUTHENTICATE_UPDATE } from "@/modules/auth/actionConstants";

// Lazy socket initialization with reconnection for better reliability
// Socket will connect when first needed and auto-reconnect if disconnected
export let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(socketURL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });
  }
  return socket;
};

const CreateDateCountSync = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.authReducer.user);
  const syncedUserRef = React.useRef("");

  React.useEffect(() => {
    let cancelled = false;

    const syncCount = async () => {
      if (!user?.user_name || !user?.token) return;
      if (
        syncedUserRef.current === user.user_name &&
        typeof user?.active_dates_count === "number"
      ) {
        return;
      }

      try {
        const res = await apiRequest({
          method: "GET",
          url: "date",
          token: user?.token,
          params: {
            user_name: user?.user_name,
            current_page: 1,
            per_page: 10000,
          },
          timeout: 10000,
        });

        if (cancelled) return;

        const dates = res?.data?.data?.dates || [];
        const activeDatesCount = getActiveDateCount(dates);
        syncedUserRef.current = user.user_name;
        dispatch({
          type: AUTHENTICATE_UPDATE,
          payload: {
            active_dates_count: activeDatesCount,
          },
        });
      } catch (error) {
        if (!cancelled) {
          console.log("Failed to sync active date count", error);
          syncedUserRef.current = user.user_name;
          dispatch({
            type: AUTHENTICATE_UPDATE,
            payload: {
              active_dates_count: 0,
            },
          });
        }
      }
    };

    syncCount();

    return () => {
      cancelled = true;
    };
  }, [dispatch, user?.token, user?.user_name, user?.active_dates_count]);

  return null;
};

// export const socket = io(socketURL, {
//   autoConnect: true,
//   // reconnection: true,
//   // reconnectionDelay: 1000,
//   // reconnectionDelayMax: 5000,
//   // reconnectionAttempts: Infinity,
// });

class MyApp extends App {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      history: [],
      screenSize: this.getCurrentDimension(),
    };
  }

  getCurrentDimension = () => {
    if (typeof window !== "undefined") {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
  };

  componentDidMount() {
    const { asPath } = this.props.router;

    // lets add initial route to `history`
    this.setState((prevState) => ({ history: [...prevState.history, asPath] }));
    Router.events.on("routeChangeStart", (url) => {
      this.setState({ isLoading: true });
      // console.log("I am Loading...");
    });
    Router.events.on("routeChangeComplete", (url) => {
      setTimeout(() => {
        this.setState({ isLoading: false });
      }, 150);
      // console.log("I am Loaded...");
    });

    // hide all console logs and errors
    if (process.env.NODE_ENV === "production") {
      console.log = console.error = console.warn = function () {};
    }
    if (document.body.dataset.scrollLock !== "true") {
      document.body.style.overflow = "unset";
    }
    window.addEventListener("resize", this.updateDimension);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimension);
  }

  updateDimension = () => {
    this.setState({ screenSize: this.getCurrentDimension() });
  };

  componentDidUpdate() {
    const { history } = this.state;
    const { asPath } = this.props.router;

    // if current route (`asPath`) does not equal
    // the latest item in the history,
    // it is changed so lets save it
    if (history[history.length - 1] !== asPath) {
      this.setState((prevState) => ({
        history: [...prevState.history, asPath],
      }));
    }
    if (process.env.NODE_ENV === "production") {
      console.log = console.error = console.warn = function () {};
    }
    if (document.body.dataset.scrollLock !== "true") {
      document.body.style.overflow = "unset";
    }
  }

  static async getInitialProps({ Component, ctx }) {
    let pageProps = {};

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps({ ctx });
    }
    return { pageProps };
  }

  render() {
    const { Component, pageProps, store } = this.props;
    const { asPath } = this.props.router;
    const accessToken = loadFromLocalStorage();
    const isCreateDateRoute = asPath.startsWith("/create-date");

    const lsLoader =
      (this.state.isLoading &&
        !isCreateDateRoute &&
        asPath !== "/user/user-profile" &&
        asPath !== "/auth/profile?edit=true" &&
        asPath !== "/auth/profile" &&
        asPath !== "/user/user-list" &&
        !asPath.includes("/user/user-profile/")) ||
      (this.state.isLoading && !accessToken);

    const islandScapeInMobile =
      this.state.screenSize?.width < 1181 &&
      this.state.screenSize?.width > this.state.screenSize?.height;

    if (islandScapeInMobile) {
      return <LanscapeDecline />;
    }

    return (
      <Provider store={store}>
        <CreateDateCountSync />
        <Head>
          <title>Le Society</title>
          <link rel="icon" href="/favicon.svg" />
          <link
            href="https://fonts.googleapis.com/css?family=Pacifico"
            rel="stylesheet"
          />
          <meta
            name="viewport"
            content="width=device-width, minimum-scale=1.0, maximum-scale = 1.0, user-scalable = no"
          />
        </Head>
        {lsLoader ? (
          <Loader />
        ) : (
          <Component
            {...pageProps}
            history={this.state.history}
            isLoading={this.state.isLoading}
          />
        )}

        <ToastContainer />
      </Provider>
    );
  }
}

export default withRedux(createStore)(withReduxSaga({ async: true })(MyApp));

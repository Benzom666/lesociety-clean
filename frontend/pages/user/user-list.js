import React, { useState, useEffect } from "react";
import HeaderLoggedIn from "core/loggedInHeader";
import Image from "next/image";
import Footer from "core/footer";
import router from "next/router";
import LocationPopup from "@/core/locationPopup";
import withAuth from "../../core/withAuth";
import { apiRequest, countriesCode, socketURL } from "utils/Utilities";
import {
  fetchCities,
  fetchLiveLocation,
} from "../../modules/auth/forms/steps/validateRealTime";
import { useDispatch, useSelector } from "react-redux";
import DatePopup from "core/createDatePopup";
import useWindowSize from "utils/useWindowSize";
import { Formik, Field, Form } from "formik";
import * as Yup from "yup";
import CustomInput from "Views/CustomInput";
import { IoIosSend } from "react-icons/io";
import { useRef } from "react";
import SkeletonArticle from "@/modules/skeleton/SkeletonArticle";
import io from "socket.io-client";
import { removeCookie } from "utils/cookie";
import MessageSend from "assets/message_send.png";
import MessageSend2 from "assets/message_send2.png";
import MessageSend3 from "assets/Send.jpg";
import MessageSend4 from "assets/Send.png";
import MessageSend5 from "assets/Send.svg";
import LocationModalPopUp from "@/core/locationModalPopUp";
import classNames from "classnames";
import { change } from "redux-form";
import DateAndLocation from "@/modules/location/DateAndLocation";
import {
  changeSelectedLocationPopup,
  logout,
} from "@/modules/auth/authActions";
import ImageShow from "@/modules/ImageShow";
import Loader from "@/modules/Loader/Loader";
import StarIcon from "../../assets/Star.png";
import StarBlankIcon from "../../assets/Star_blank.png";
import DateLiveModal from "@/core/DateLiveModal";
import EditDateReviewModal from "@/core/EditDateReviewModal";
import { AUTHENTICATE_UPDATE } from "@/modules/auth/actionConstants";
import PaywallModal from "@/core/PaywallModal";
import { usePaywall } from "../../hooks/usePaywall";
import { getPayment } from "@/utils/payment";

export const socket = io(socketURL, {
  reconnection: true,
  autoConnect: true,
  transports: ["websocket", "polling", "flashsocket"],
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
});

function UserList(props) {
  const { width } = useWindowSize();
  const [classPopup, setPopupClass] = React.useState("hide");
  const [textClass, setTextSlideClass] = React.useState("");
  const [locationPopup, setLocationPoup] = React.useState(false);
  const [selectedLocation, setLocation] = React.useState({});

  const user = useSelector((state) => state.authReducer.user);
  const state = useSelector((state) => state.authReducer);
  const [modalIsOpen, setIsOpen] = React.useState(user?.gender === "female");
  const [receiverData, setReceiverData] = React.useState("");
  const [messageError, setMessageError] = React.useState("");
  const [conversations, setConversations] = useState([]);
  const [alreadyMessagedFromUser, setAlreadyMessagedFromUser] = useState(false);
  const [countries, setCountry] = useState("");
  const dispatch = useDispatch();
  const country = user?.country && countriesCode[user?.country];
  const [searchStatus, setSearchStaus] = useState(false);
  // for current location
  const [currentLocationLoading, setCurrentLocationLoading] = useState(false);

  const [show, setShow] = useState(false);
  const [showDateLiveModal, setShowDateLiveModal] = useState(false);
  const [showEditReviewModal, setShowEditReviewModal] = useState(false);
  const [dontShowLiveAgain, setDontShowLiveAgain] = useState(false);

  // for notification
  const [count, setCount] = useState(0);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const iconRef = useRef(null);
  const isBodyLockedRef = useRef(false);

  const [isSuperInterested, setIsSuperInterested] = useState(false);
  const { paywallConfig, showMenFirstDatePaywall, closePaywall } = usePaywall();
  const galleryTitle =
    (searchStatus || Boolean(router?.query?.city)) && selectedLocation?.city
      ? selectedLocation.city
      : "Main Gallery";

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    document.body.classList.add("user-list-page");
    document.documentElement.classList.add("user-list-page");

    return () => {
      document.body.classList.remove("user-list-page");
      document.documentElement.classList.remove("user-list-page");
    };
  }, []);

  // useEffect(() => {
  //   if (user?.gender === "male" && state?.showSelectedLocationPopup) {
  //     setShow(true);
  //   }
  // }, [user]);

  const lockBodyScroll = () => {
    if (typeof window === "undefined" || isBodyLockedRef.current) return;
    isBodyLockedRef.current = true;
    document.body.dataset.scrollLock = "true";
    // Only lock scroll for the message popup, not the entire page
    const messagePopup = document.querySelector('.message-popup');
    if (messagePopup) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.touchAction = "none";
    }
  };

  const unlockBodyScroll = () => {
    if (typeof window === "undefined" || !isBodyLockedRef.current) return;
    isBodyLockedRef.current = false;
    delete document.body.dataset.scrollLock;
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
    document.documentElement.style.overflow = "";
    document.documentElement.style.touchAction = "";
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.touchAction = "";
    }

    if (!user?._id) return undefined;

    socket.auth = { user: user };
    socket.connect();
    const handleConnect = () => {
      console.log("connected");
    };
    const handleDisconnect = (reason) => {
      console.log("socket disconnected reason", reason);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      if (typeof window !== "undefined") {
        document.body.style.overflow = "";
        document.body.style.touchAction = "";
        document.documentElement.style.overflow = "";
        document.documentElement.style.touchAction = "";
      }
    };
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return undefined;

    const handleConnectError = () => {
      console.log("connect_error");
      socket.auth = { user: user };
      socket.connect();
    };

    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect_error", handleConnectError);
    };
  }, [user?._id]);

  useEffect(() => {
    if (!router?.isReady) return;

    if (router?.query?.city) {
      setLocation({
        city: router?.query?.city,
        country: router?.query?.country,
        province: router?.query?.province,
      });
      setSearchStaus(user?.location !== router?.query?.city);
    } else {
      setSearchStaus(false);
      setLocation({
        city: user?.location,
        country: country,
        province: user?.province,
      });
    }
  }, [
    router?.isReady,
    router?.query?.city,
    router?.query?.country,
    router?.query?.province,
    user?.location,
    user?.province,
    country,
  ]);

  useEffect(() => {
    if (!router?.isReady || user?.gender !== "female") {
      setShowDateLiveModal(false);
      setShowEditReviewModal(false);
      return;
    }

    const shouldShowPosted =
      Boolean(router?.query?.posted) && !user?.date_live_popup_dismissed;
    const shouldShowEdited = Boolean(router?.query?.edited) && !shouldShowPosted;

    setShowDateLiveModal(shouldShowPosted);
    setShowEditReviewModal(shouldShowEdited);
  }, [
    router?.isReady,
    router?.query?.edited,
    router?.query?.posted,
    user?.date_live_popup_dismissed,
    user?.gender,
  ]);

  useEffect(() => {
    if (!router.isReady || !router.query?.payment_id) {
      return;
    }

    let cancelled = false;

    const syncPaymentReturn = async () => {
      const paymentId = router.query.payment_id;
      const maxAttempts = 8;

      for (let attempt = 0; attempt < maxAttempts && !cancelled; attempt += 1) {
        try {
          const paymentResponse = await getPayment(paymentId);
          const paymentStatus = String(
            paymentResponse?.data?.status || ""
          ).toLowerCase();

          const freshUserRes = await apiRequest({
            method: "GET",
            url: "user/me",
          });

          if (freshUserRes?.data?.data?.user) {
            dispatch({
              type: AUTHENTICATE_UPDATE,
              payload: freshUserRes.data.data.user,
            });
          }

          if (
            ["completed", "complete", "paid"].includes(paymentStatus) ||
            attempt === maxAttempts - 1
          ) {
            const nextQuery = { ...router.query };
            delete nextQuery.payment_id;
            router.replace(
              {
                pathname: router.pathname,
                query: nextQuery,
              },
              undefined,
              { shallow: true }
            );
            return;
          }
        } catch (error) {
          if (attempt === maxAttempts - 1) {
            const nextQuery = { ...router.query };
            delete nextQuery.payment_id;
            router.replace(
              {
                pathname: router.pathname,
                query: nextQuery,
              },
              undefined,
              { shallow: true }
            );
            return;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    };

    syncPaymentReturn();

    return () => {
      cancelled = true;
    };
  }, [dispatch, router]);

  const handleCloseDateLiveModal = async () => {
    if (dontShowLiveAgain) {
      try {
        const res = await apiRequest({
          method: "POST",
          url: "user/update-popup-preferences",
          data: { date_live_popup_dismissed: true },
        });
        if (res?.data?.data?.user) {
          dispatch({
            type: AUTHENTICATE_UPDATE,
            payload: res.data.data.user,
          });
        }
      } catch (err) {
        console.log("Failed to update popup preference", err);
      }
    }
    setShowDateLiveModal(false);
    if (router?.query?.posted) {
      const nextQuery = { ...router.query };
      delete nextQuery.posted;
      delete nextQuery.city;
      delete nextQuery.country;
      delete nextQuery.province;
      router.replace(
        {
          pathname: "/user/user-list",
          query: nextQuery,
        },
        undefined,
        { shallow: true }
      );
    }
  };

  const handleCloseEditReviewModal = () => {
    setShowEditReviewModal(false);
    if (router?.query?.edited) {
      router.replace("/user/user-list", undefined, { shallow: true });
    }
  };

  useEffect(() => {
    getConversations();
  }, []);

  useEffect(() => {
    const eventName = `request-${user?._id}`;
    const handleRequest = (message) => {
      console.log("reqested message header", message);
      getConversations();
    };

    socket.on(eventName, handleRequest);

    return () => {
      socket.off(eventName, handleRequest);
    };
  }, [user?._id]);

  useEffect(() => {
    const eventName = `recieve-${user?._id}`;
    const handleReceive = (message) => {
      console.log("recieve message header", message);
      getConversations();
    };

    socket.on(eventName, handleReceive);

    return () => {
      socket.off(eventName, handleReceive);
    };
  }, [user?._id]);

  useEffect(() => {
    const handleConnect = () => {
      console.log(socket.id);
    };
    const notificationEvent = `push-notification-${user.email}`;
    const handleNotification = (message) => {
      console.log("notif received", message);
      const unc = message?.notifications?.filter(
        (item) => item.status === 0 && item.type !== "notification"
      ).length;
      localStorage.setItem("unreadNotifCount", JSON.stringify(unc));
      setCount(unc);
    };

    socket.on("connect", handleConnect);
    socket.on(notificationEvent, handleNotification);

    return () => {
      socket.off("connect", handleConnect);
      socket.off(notificationEvent, handleNotification);
    };
  }, [user?.email, setCount]);

  useEffect(() => {
    if (classPopup === "show") {
      initializeMoveIconPosition();
      lockBodyScroll();
    } else {
      unlockBodyScroll();
    }
    return () => {
      unlockBodyScroll();
    };
  }, [classPopup]);

  const unReadedConversationLength = conversations?.filter(
    (c) =>
      c?.message &&
      !c.message?.read_date_time &&
      c?.message?.sender_id !== user?._id
  )?.length;

  const getConversations = async () => {
    try {
      const res = await apiRequest({
        method: "GET",
        url: `chat/chatroom-list`,
      });
      // console.log("res", res.data?.data?.chatRooms);
      const conversations =
        res.data?.data?.chatRooms.length > 0
          ? res.data?.data?.chatRooms.filter((chat) => chat !== null)
          : [];
      setConversations(conversations);
    } catch (err) {
      console.log("err", err);
      if (
        err?.response?.status === 401 &&
        err?.response?.data?.message === "Failed to authenticate token!"
      ) {
        setTimeout(() => {
          logout(router, dispatch);
        }, 100);
      }
      return err;
    }
  };

  const closePopup = (formProps) => {
    setPopupClass("hide");

    if (formProps) {
      formProps?.setFieldValue("message", "");
    }
  };

  const initializeMoveIconPosition = () => {
    const icon = document.querySelector(".icon-move");
    if (icon && iconRef.current) {
      const dummyIcon = iconRef.current;
      const dimension = dummyIcon.getBoundingClientRect();
      icon.style.transition = "none";
      icon.style.left = `${dimension.left}px`;
      icon.style.top = `${dimension.top}px`;
    }
  };

  const openPopup = (item) => {
    setPopupClass("show");
    setReceiverData(item);
  };

  const handleSubmit = async (values) => {
    const isMale = user?.gender === "male";
    setMessageError("");
    
    // FORCE REFRESH - Get current user data from API instead of stale Redux state
    let currentInterestedTokens = user?.interested_tokens || 0;
    let currentSuperInterestedTokens = user?.super_interested_tokens || 0;
    let apiFetchSuccess = false;
    
    // If male, try to get fresh token counts from API first
    if (isMale) {
      try {
        console.log("[TOKEN DEBUG] Fetching fresh user data...");
        const freshUserRes = await apiRequest({
          method: "GET",
          url: "user/me",
        });
        console.log("[TOKEN DEBUG] Fresh user response:", freshUserRes);
        if (freshUserRes?.data?.data?.user) {
          const freshUser = freshUserRes.data.data.user;
          currentInterestedTokens = freshUser.interested_tokens || 0;
          currentSuperInterestedTokens = freshUser.super_interested_tokens || 0;
          apiFetchSuccess = true;
          // Update Redux with fresh data
          dispatch({ type: AUTHENTICATE_UPDATE, payload: freshUser });
          console.log("[TOKEN DEBUG] Fresh tokens from API:", { currentInterestedTokens, currentSuperInterestedTokens });
        } else {
          console.log("[TOKEN DEBUG] No user data in response, using Redux:", { currentInterestedTokens, currentSuperInterestedTokens });
        }
      } catch (err) {
        console.error("[TOKEN DEBUG] API call failed:", err);
        console.log("[TOKEN DEBUG] Using Redux state:", { currentInterestedTokens, currentSuperInterestedTokens });
      }
    }

    console.log("[TOKEN DEBUG] isMale:", isMale);
    console.log("[TOKEN DEBUG] interestedTokens:", currentInterestedTokens);
    console.log("[TOKEN DEBUG] superInterestedTokens:", currentSuperInterestedTokens);
    console.log("[TOKEN DEBUG] isSuperInterested:", isSuperInterested);

    // Token validation for men
    if (isMale) {
      console.log("[TOKEN DEBUG] FINAL tokens used for check:", { currentInterestedTokens, currentSuperInterestedTokens });
      
      if (isSuperInterested) {
        // Trying to send Super Interested - must have super interested tokens
        if (currentSuperInterestedTokens === 0) {
          console.log("[TOKEN DEBUG] BLOCKED - No super interested tokens");
          showMenFirstDatePaywall(
            receiverData?.user_name ||
              receiverData?.user_data?.[0]?.full_name ||
              receiverData?.user_data?.[0]?.name ||
              receiverData?.user_data?.[0]?.username ||
              "Someone",
            48,
            true // Force show paywall - we know tokens are 0
          );
          return false;
        }
      } else {
        // Trying to send regular Interested - must have interested tokens (NOT super interested tokens!)
        if (currentInterestedTokens === 0) {
          console.log("[TOKEN DEBUG] BLOCKED - No interested tokens (regular)");
          showMenFirstDatePaywall(
            receiverData?.user_name ||
              receiverData?.user_data?.[0]?.full_name ||
              receiverData?.user_data?.[0]?.name ||
              receiverData?.user_data?.[0]?.username ||
              "Someone",
            48,
            true // Force show paywall - we know tokens are 0
          );
          return false;
        }
      }
    }

    console.log("[TOKEN DEBUG] Proceeding with message send...");
    
    try {
      const data = {
        senderId: user?._id ?? "",
        recieverId:
          receiverData?.user_data?.length > 0
            ? receiverData?.user_data[0]?._id
            : "",
        message: values.message ?? "",
        dateId: receiverData?._id ?? "",
        isSuperInterested: isSuperInterested,
      };
      
      console.log("[TOKEN DEBUG] Sending request with data:", data);
      
      const res = await apiRequest({
        data: data,
        method: "POST",
        url: `chat/request`,
      });
      
      console.log("[TOKEN DEBUG] Response:", res?.data);
      
      // Decrement tokens after successful send
      if (isMale && res?.data?.status === 200) {
        const balances = res?.data?.data?.userBalances;
        const optimisticBalances = isSuperInterested
          ? {
              super_interested_tokens: Math.max(
                0,
                (currentSuperInterestedTokens || 0) - 1
              ),
            }
          : {
              interested_tokens: Math.max(
                0,
                (currentInterestedTokens || 0) - 1
              ),
            };
        dispatch({ type: AUTHENTICATE_UPDATE, payload: optimisticBalances });
        if (balances) {
          const reconciledBalances = isSuperInterested
            ? {
                super_interested_tokens: Math.min(
                  optimisticBalances.super_interested_tokens ?? 0,
                  balances.super_interested_tokens ?? 0
                ),
              }
            : {
                interested_tokens: Math.min(
                  optimisticBalances.interested_tokens ?? 0,
                  balances.interested_tokens ?? 0
                ),
              };
          dispatch({ type: AUTHENTICATE_UPDATE, payload: reconciledBalances });
        }
        console.log("[TOKEN DEBUG] Message sent successfully, fetching fresh user data");
        // Backend already decremented tokens, just fetch fresh data
        try {
          const freshUserRes = await apiRequest({
            method: "GET",
            url: "user/me",
          });
          if (freshUserRes?.data?.data?.user) {
            dispatch({ type: AUTHENTICATE_UPDATE, payload: freshUserRes.data.data.user });
            console.log("[TOKEN DEBUG] User state updated with fresh data");
          }
        } catch (refreshErr) {
          console.error("[TOKEN DEBUG] Failed to refresh user data:", refreshErr);
        }
      }
      
      moveIcon();
      setAlreadyMessagedFromUser(true);
      return true;
    } catch (err) {
      console.error("[TOKEN DEBUG] Send message error:", err);
      const errorMessage = err.response?.data?.message ?? "";
      const statusCode = err?.response?.status;
      setMessageError(errorMessage);
      
      // Show paywall if server returns 403 (no tokens)
      if (statusCode === 403 && isMale) {
        console.log("[TOKEN DEBUG] Server returned 403 - showing paywall");
        showMenFirstDatePaywall(
          receiverData?.user_name ||
            receiverData?.user_data?.[0]?.full_name ||
            receiverData?.user_data?.[0]?.name ||
            receiverData?.user_data?.[0]?.username ||
            "Someone",
          48,
          true // Force show paywall - server confirmed no tokens
        );
        return false;
      }
      
      if (
        statusCode === 401 &&
        errorMessage === "Failed to authenticate token!"
      ) {
        setLogoutLoading(true);
        setTimeout(() => {
          logout(router, dispatch);
          setLogoutLoading(false);
        }, 2000);
      }
      return false;
    }
  };

  function growDiv(id) {
    // setDateId(id)
    let growDiv = document.getElementById("message-popup");
    if (growDiv.style?.top) {
      growDiv.style.top = "100%";
    } else {
      growDiv.style.top = "unset";
    }
  }

  const moveIcon = () => {
    setTextSlideClass("show");
    const element = document.querySelector(".icon-move");
    const target = document.getElementById("message-icon");
    if (target && element) {
      const startRect = iconRef.current?.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      if (!startRect) {
        closePopup();
        setTextSlideClass("");
        setIsSuperInterested(false);
        return;
      }

      const startLeft = startRect.left + startRect.width / 2 - 15;
      const startTop = startRect.top + startRect.height / 2 - 15;
      const rawTargetLeft = targetRect.left + targetRect.width / 2 - 15;
      const rawTargetTop = targetRect.top + targetRect.height / 2 - 15;
      const targetLeft = Math.min(
        Math.max(rawTargetLeft, 12),
        window.innerWidth - 42
      );
      const targetTop = Math.min(
        Math.max(rawTargetTop, 12),
        window.innerHeight - 42
      );

      element.style.transition = "none";
      element.style.opacity = 1;
      element.style.left = `${startLeft}px`;
      element.style.top = `${startTop}px`;

      void element.offsetWidth;

      window.requestAnimationFrame(() => {
        element.style.transition = "left 3s ease-in-out, top 3s ease-in-out, opacity 0.2s ease";
        element.style.left = `${targetLeft}px`;
        element.style.top = `${targetTop}px`;
      });
    }
    setTimeout(() => {
      if (element) {
        element.style.opacity = 0;
        element.style.transition = "none";
      }
      closePopup();
      setTextSlideClass("");
      setIsSuperInterested(false);
    }, 3000);
  };

  useEffect(() => {
    if (user?.gender === "male") {
      setCountry(user?.country_code);
    }
  }, []);

  const handleFectchCurrentLocation = () => {
    setCurrentLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (
          position.coords.latitude !== undefined &&
          position.coords.longitude !== undefined
        ) {
          const locations = await fetchLiveLocation(
            position.coords.latitude,
            position.coords.longitude,
            countries
          );
          const location = locations[0];
          setLocation({
            city: location.name,
            country: location?.country[0]?.short_code,
            province: location?.province[0]?.short_code?.split("-")[1],
            stateName: location?.province[0]?.text,
            countryName: location?.country[0]?.text,
          });
          // setShow(false);
          dispatch(changeSelectedLocationPopup(false));
          dispatch(change("LocationPopup", "enter_city", location?.name));
          setCurrentLocationLoading(false);
        }
      },
      (err) => {
        setCurrentLocationLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // useEffect(() => {
  //   socket.auth = { user: user };
  //   socket.connect();
  //   console.log("socket", socket.auth);
  //   socket.on("connect", () => {
  //     console.log("connected", socket.connected);
  //   });
  //   socket.on("disconnect", (reason) => {
  //     console.log("socket disconnected reason", reason);
  //   });
  // }, []);

  // useEffect(() => {
  //   socket.on("connect_error", () => {
  //     console.log("connect_error");
  //     socket.auth = { user: user };
  //     socket.connect();
  //   });
  // }, [!socket.connected]);

  // useEffect(() => {
  //   // if (socket.connected) {
  //   console.log("Notif socket connected", socket.connected);
  //   //`push-notification-${user?.email}`
  //   socket.on(`push-notification-${user?.email}`, (message) => {
  //     console.log("notif received", message);
  //   });
  //   // }
  // }, [socket.connected]);

  // if (show) {
  //   return (
  //     <LocationModalPopUp
  //       onClose={() => {
  //         setShow(false);
  //         dispatch(changeSelectedLocationPopup(false));
  //       }}
  //       show={show}
  //       handleFectchCurrentLocation={handleFectchCurrentLocation}
  //       currentLocationLoading={currentLocationLoading}
  //     />
  //   );
  // }

  if (logoutLoading) {
    return <Loader />;
  }

  return (
    <div className="inner-page" id="infiniteScroll">
      <HeaderLoggedIn
        fixed={width < 767 || width > 767}
        isBlack={locationPopup}
        unReadedConversationLength={unReadedConversationLength}
        count={count}
        setCount={setCount}
        setLogoutLoading={setLogoutLoading}
      />
      <DateLiveModal
        isOpen={showDateLiveModal}
        onClose={handleCloseDateLiveModal}
        checked={dontShowLiveAgain}
        onToggleChecked={(next) =>
          setDontShowLiveAgain(
            typeof next === "boolean" ? next : !dontShowLiveAgain
          )
        }
      />
      <EditDateReviewModal
        isOpen={showEditReviewModal}
        onClose={handleCloseEditReviewModal}
      />
      {/* <div
        className={classNames(
          `modal fade ${show ? "show d-block modal-open" : "d-none"}`,
          width > 1399 && "modal-fade-1"
        )}
      ></div> */}
      <div className="inner-part-page">
        <div className="pt-5 pb-4">
          <div className="container user_list_wrap">
            <div className="row topSpace_Desk">
              <div className="col-md-2"></div>
              <div className="col-md-8">
                <div className="row">
                  <div className="col-md-12">
                    <div className="d-flex align-items-center justify-content-center justify-content-md-between pb-3 top-space">
                      <span className="hidden-sm">Nearby</span>
                      {width < 430 ? (
                        <div
                          className="d-flex align-items-center justify-content-end"
                          // style={
                          //   (scrollType === "up" || "down") &&
                          //   scrollPosition > 5 &&
                          //   !locationPopup
                          //     ? width > 767
                          //       ? {
                          //           position: "fixed",
                          //           width: "59%",
                          //           zIndex: "10",
                          //         }
                          //       : {
                          //           position: "fixed",
                          //           left: "34%",
                          //           zIndex: "10",
                          //         }
                          //     : { position: "relative" }
                          // }
                        >
                          {/* <span className="hidden-sm">Nearby</span> */}
                          <div
                            onClick={() => setLocationPoup(true)}
                            className="selct-wrap-sort"
                          >
                            <label>
                              <span className="city-txt city-txt-gallary">
                                {galleryTitle}
                              </span>
                            </label>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                <DateAndLocation
                  currentLocationLoading={currentLocationLoading}
                  selectedLocation={selectedLocation}
                  show={show}
                  openPopup={openPopup}
                  closePopup={closePopup}
                  receiverData={receiverData}
                  alreadyMessagedFromUser={alreadyMessagedFromUser}
                  setAlreadyMessagedFromUser={setAlreadyMessagedFromUser}
                  setLocation={setLocation}
                  growDiv={growDiv}
                  searchStatus={searchStatus}
                  setLogoutLoading={setLogoutLoading}
                />
              </div>
              {width > 767 && (
                <div className="col-md-2">
                  <div
                    className="d-flex align-items-center justify-content-end"
                    style={{ marginTop: "26px" }}
                    // style={
                    //   (scrollType === "up" || "down") &&
                    //   scrollPosition > 5 &&
                    //   !locationPopup
                    //     ? width > 767
                    //       ? { position: "fixed", width: "59%", zIndex: "99" }
                    //       : { position: "fixed", left: "34%", zIndex: "99" }
                    //     : { position: "relative" }
                    // }
                  >
                    {/* <span className="hidden-sm">Nearby</span> */}
                    <div
                      onClick={() => setLocationPoup(true)}
                      className="selct-wrap-sort position-fixed"
                    >
                      <label>
                        <span className="city-txt city-txt-gallary">
                          {galleryTitle}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {classPopup === "show" && (
        <div
          className="message-popup-backdrop"
          onClick={() => closePopup()}
          onPointerDown={() => closePopup()}
        />
      )}
      <div
        id="message-popup"
        className={`message-popup ${classPopup}`}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
      >
        <Formik
          initialValues={{
            message: "",
          }}
          validationSchema={Yup.object({
            message: Yup.string().required("Please enter your message"),
          })}
          onSubmit={async (values, { resetForm }) => {
            if (values.message?.trim() !== "") {
              const didSend = await handleSubmit(values);
              if (didSend) {
                resetForm();
              }
            }
          }}
        >
          {(formProps) => {
            return (
              <Form>
                <span
                  onClick={() => {
                    closePopup(formProps);
                    formProps.setFieldValue("message", "");
                  }}
                  className="close-button"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12.9924 12.9926L1.00244 1.00006"
                      stroke="white"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M12.9887 1.00534L1.00873 12.9853"
                      stroke="white"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
                <p className="msg">
                  "
                  {receiverData?.user_data?.length > 0 &&
                    receiverData?.user_data[0]?.tagline}
                  "
                </p>
                <div
                  className={`super__interested__star ${
                    isSuperInterested ? "active" : ""
                  }`}
                  onClick={() => setIsSuperInterested(!isSuperInterested)}
                >
                  <Image
                    src={isSuperInterested ? StarIcon : StarBlankIcon}
                    height={15}
                    width={15}
                  />

                  <span className="super__interested">
                    I’m Super Interested!
                  </span>
                </div>
                <div>
                <div
                  className=""
                  style={{
                      display: "flex",
                      justifyContent: "center",
                      width: "100%",
                    }}
                  >
                    <Field
                      // className={`${textClass}`}
                      className={`${textClass} ${
                        isSuperInterested
                          ? "is__super__interested__message__input"
                          : "message__modal__input"
                      }`}
                      placeholder="Type your message here…"
                      name="message"
                      id="message"
                      component={CustomInput}
                      style={{
                        width: "90%",
                      }}
                    />
                    {isSuperInterested && (
                      <div
                        style={{
                          position: "absolute",
                          left: "14%",
                          height: "50px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Image
                          src={StarIcon}
                          alt="star"
                          width={15}
                          height={15}
                          style={{
                            paddingTop: "10px !important",
                          }}
                        />
                      </div>
                    )}
                    <button
                      type="submit"
                      style={{
                        position: "absolute",
                        right: "13%",
                        background: "transparent",
                        border: "none",
                        paddingBottom: "5px",
                        paddingTop: "11px",
                        cursor: "pointer",
                      }}
                      aria-label="Send message request"
                    >
                      <div
                        ref={iconRef}
                        style={{
                          background: "transparent",
                          border: "none",
                          pointerEvents: "none",
                        }}
                      >
                        <Image
                          src={
                            formProps.values.message === ""
                              ? MessageSend5
                              : MessageSend2
                          }
                          alt="send-btn"
                          width={30}
                          height={30}
                        />
                      </div>
                    </button>
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
        <p className="tip">Tip: Maybe mention why you’re here.</p>
      </div>
      <div
        className="icon-move"
        style={{
          background: "transparent",
          border: "none",
        }}
      >
        <Image src={MessageSend2} alt="icon-move" width={30} height={30} />
      </div>
      {/* <DatePopup
                modalIsOpen={modalIsOpen}
                closeModal={closeModal}
            /> */}
      <LocationPopup
        modalIsOpen={locationPopup}
        closeModal={() => setLocationPoup(false)}
        selectedLocation={selectedLocation}
        setLocation={setLocation}
        setSearchStaus={setSearchStaus}
      />
      <PaywallModal
        isOpen={paywallConfig.isOpen}
        onClose={closePaywall}
        type={paywallConfig.type}
        expiresIn={paywallConfig.expiresIn}
        userName={paywallConfig.userName}
      />
    </div>
  );
}

export default withAuth(UserList);

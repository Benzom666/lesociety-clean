import React, { useRef } from "react";
import UserImg from "assets/img/profile.png";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import { CustomIcon } from "core/icon";
import Modal from "react-modal";
import Link from "next/link";
import H5 from "../../core/H5";
import { apiRequest, dateCategory } from "utils/Utilities";
import { IoIosClose } from "react-icons/io";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { HiLockOpen } from "react-icons/hi";
import { useRouter } from "next/router";
import SkeletonUserCardListForMessage from "@/modules/skeleton/SkeletonUserCardListForMessage";
import SkeletonElement from "@/modules/skeleton/SkeletonElement";
import ImageShow from "@/modules/ImageShow";
import useWindowSize from "utils/useWindowSize";
import { logout } from "@/modules/auth/authActions";
import { AUTHENTICATE_UPDATE } from "@/modules/auth/actionConstants";
import StarIcon from "../../assets/request star.png";
import TimerProgressBar from "../../components/TimerProgressBar";
import PaywallModal from "../../core/PaywallModal";
import { usePaywall } from "../../hooks/usePaywall";

const REQUESTS_RETURN_STATE_KEY = "messages-requests-return-state";

const UserCardListForMessage = ({
  conversations,
  setConversations,
  isDesktopView,
  getConversations,
  setCurrentChat,
  tabIndexChange,
  selectedTabIndex,
  socket,
  toggleChat,
  mobile,
  isOpen = false,
  initialRequestId = null,
  onClose = () => {},
}) => {
  const [modalIsOpen, setIsOpen] = React.useState(isOpen);
  const [dateDetailsIsOpen, setDateDetailsIsOpen] = React.useState(false);
  const [msgModal, setMsgModal] = React.useState(false);
  const [pageLoading, setPageLoading] = React.useState(true);
  const user = useSelector((state) => state.authReducer.user);
  const authUser = useSelector((state) => state.authReducer.user);
  const router = useRouter();
  const sliderRef = useRef(null);
  const growRef = useRef(null);
  const { paywallConfig, showLadiesChatPaywall, closePaywall } = usePaywall();

  const dispatch = useDispatch();

  const width = useWindowSize();
  const isMobileViewport = typeof width === "number" ? width <= 767 : false;
  function openModal() {
    setIsOpen(true);
    setPageLoading(true);
  }
  function closeModal() {
    setIsOpen(false);
    setPageLoading(false);
    tabIndexChange(0);
    onClose();
  }
  
  // Sync external isOpen prop with internal state
  React.useEffect(() => {
    setIsOpen(isOpen);
  }, [isOpen]);

  React.useEffect(() => {
    if (!modalIsOpen) {
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
  }, [modalIsOpen]);

  const pendingConversations = React.useMemo(
    () => conversations?.filter((c) => c.status == 0) || [],
    [conversations]
  );

  React.useEffect(() => {
    if (!modalIsOpen) {
      return;
    }

    setPageLoading(false);
  }, [modalIsOpen, pendingConversations.length]);

  React.useEffect(() => {
    if (!modalIsOpen || !initialRequestId || !sliderRef.current) {
      return;
    }

    const requestIndex = pendingConversations.findIndex((conversation) => {
      return (
        conversation?._id === initialRequestId ||
        conversation?.message?.room_id === initialRequestId
      );
    });

    if (requestIndex >= 0) {
      sliderRef.current.slickGoTo(requestIndex, true);
    }
  }, [initialRequestId, modalIsOpen, pendingConversations]);

  const persistReturnState = (conversation) => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      REQUESTS_RETURN_STATE_KEY,
      JSON.stringify({
        source: "messages-requests",
        requestId: conversation?._id || null,
        roomId: conversation?.message?.room_id || null,
      })
    );
  };

  const fetchLatestUser = async () => {
    try {
      const freshUserRes = await apiRequest({
        method: "GET",
        url: "user/me",
      });
      if (freshUserRes?.data?.data?.user) {
        dispatch({
          type: AUTHENTICATE_UPDATE,
          payload: freshUserRes.data.data.user,
        });
        return freshUserRes.data.data.user;
      }
    } catch (err) {
      console.log("fetch user error", err);
    }
    return null;
  };

  const postApprovedConversation = async (room_id, conversation, expiresIn = 48) => {
    const latestUser = await fetchLatestUser();
    const balanceUser = latestUser || authUser;
    const chatTokens = balanceUser?.chat_tokens || 0;
    const remainingChats = balanceUser?.remaining_chats || 0;
    if (authUser?.gender === "female" && chatTokens === 0 && remainingChats === 0) {
      showLadiesChatPaywall(expiresIn, true);
      return;
    }
    setCurrentChat(conversation);
    console.log("conversation", conversation);
    try {
      const data = {
        chatRoomId: room_id,
        senderId: conversation?.user?.id,
        // senderId: user?._id,
      };
      const res = await apiRequest({
        data,
        method: "POST",
        url: `chat/accept`,
      });
      if (res?.status === 403 || res?.data?.status === 403) {
        showLadiesChatPaywall(expiresIn, true);
        return;
      }
      console.log("res.data", res.data);
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
      if (mobile) {
        toggleChat(conversation);
      }
      // getConversations();
      setConversations((prev) => {
        const index = prev.findIndex((item) => item._id === room_id);
        prev[index].status = 1;
        return [...prev];
      });
      closeModal();
      setCurrentChat((prev) => ({
        ...prev,
        status: res?.data?.data?.chatRoom?.status,
      }));

      tabIndexChange(0);
    } catch (err) {
      console.log("err", err);
      if (err?.response?.status === 403) {
        showLadiesChatPaywall(expiresIn, true);
      }
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

  const rejectConversation = async (conversation) => {
    try {
      const roomId = conversation?.message?.room_id || conversation?._id;
      const senderId = conversation?.user?.id;

      await apiRequest({
        data: {
          chatRoomId: roomId,
          senderId,
        },
        method: "POST",
        url: `chat/reject`,
      });

      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversation._id
            ? {
                ...c,
                status: 3,
              }
            : c
        )
      );
    } catch (err) {
      console.log("reject error", err);
      if (
        err?.response?.status === 401 &&
        err?.response?.data?.message === "Failed to authenticate token!"
      ) {
        setTimeout(() => {
          logout(router, dispatch);
        }, 100);
      }
    }
  };

  const showText = (text) => {
    if (text?.length > 40) {
      return text.substring(0, 40) + "...";
    } else {
      return text;
    }
  };

  const settings = {
    dots: false,
    arrows: false,
    infinite: false,
    speed: 500,
    slidesToShow: 1.05,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: "0",
    // adaptiveHeight: true,
  };
  const customStyles = {
    content: {
      top: isMobileViewport ? "0" : "50%",
      left: isMobileViewport ? "0" : "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: isMobileViewport ? "none" : "translate(-50%, -50%)",
      width: isMobileViewport ? "100vw" : "312px",
      maxWidth: isMobileViewport ? "100vw" : "312px",
      background: "transparent",
      height: isMobileViewport ? "100dvh" : "100%",
      padding: 0,
      border: "none",
      borderRadius: 0,
      //overFlowY: "auto",
    },
    overlay: {
      backdropFilter: "blur(5px)",
    },
  };

  return (
    <>

      {conversations?.length > 0 &&
        conversations?.filter(
          (c) => c.status == 0 && c.message?.sender_id !== user?._id
        )?.length > 0 && (
          <Modal
            isOpen={modalIsOpen}
            //onRequestClose={closeModal}
            style={customStyles}
            className={
              modalIsOpen
                ? "intrested_model modal-open-blur"
                : "intrested_model"
            }
            ariaHideApp={false}
          >
            <div className="model_content">
              {pageLoading ? (
                <SkeletonElement type="close-icon-view-profile" />
              ) : (
                <IoIosClose
                  size={100}
                  className="close_btn"
                  onClick={closeModal}
                  color={"#A8A8A8"}
                />
              )}

              <Slider ref={sliderRef} {...settings}>
                {conversations.length > 0
                  ? pendingConversations?.length > 0
                    ? pendingConversations.map((conversation, index) => {
                          const profilePic =
                            conversation.user?.images.length > 0
                              ? conversation.user?.images[0]
                              : "";

                          const isSuper =
                            conversation?.isSuperInterested ??
                            conversation?.message?.isSuperInterested ??
                            conversation?.message?.is_super_interested ??
                            false;
                          const totalHours = 48;
                          const createdAt =
                            conversation?.expires_at ||
                            conversation?.message?.sent_time ||
                            conversation?.message?.createdAt ||
                            conversation?.createdAt;
                          let remainingHours = totalHours;
                          let remainingSeconds = totalHours * 3600;
                          if (createdAt) {
                            if (conversation?.expires_at) {
                              const remainingMs =
                                new Date(conversation.expires_at).getTime() - Date.now();
                              remainingSeconds = Math.max(Math.floor(remainingMs / 1000), 0);
                              remainingHours = Math.max(
                                Math.ceil(remainingSeconds / 3600),
                                0
                              );
                            } else {
                              const elapsed =
                                (Date.now() - new Date(createdAt).getTime()) /
                                (1000 * 60 * 60);
                              remainingSeconds = Math.max(
                                Math.floor((totalHours - elapsed) * 3600),
                                0
                              );
                              remainingHours = Math.max(
                                Math.ceil(remainingSeconds / 3600),
                                0
                              );
                            }
                          }

                          return pageLoading ? (
                            <SkeletonUserCardListForMessage
                              conversation={conversation}
                              getConversations={getConversations}
                              user={user}
                              setCurrentChat={setCurrentChat}
                              tabIndexChange={tabIndexChange}
                              selectedTabIndex={selectedTabIndex}
                              socket={socket}
                              profilePic={profilePic}
                            />
                          ) : (
                            <div key={index}>
                              <H5 style1={true}>
                                {conversation?.user?.user_name} is
                              </H5>
                              {isSuper && (
                                <div className="request__message__super__text">
                                  <div className="super">
                                    <CustomIcon.RequestSuperText
                                      color={"white"}
                                      size={150}
                                    />
                                  </div>
                                </div>
                              )}
                              <CustomIcon.IntrestedText
                                color={"white"}
                                size={150}
                              />
                              {isSuper && (
                                <div className="superinterested__icon">
                                  <Image
                                    src={StarIcon}
                                    height={53}
                                    width={53}
                                  />
                                </div>
                              )}
                              <figure>
                                <ImageShow
                                  className="requested-profile-img"
                                  max-width={312}
                                  width="95%"
                                  height={320}
                                  src={profilePic}
                                  alt="user image"
                                  placeholderImg="https://i.ibb.co/y8RhMrL/Untitled-design.png"
                                />
                                <span className="image_tagline">
                                  "{showText(conversation?.message?.message)}"
                                </span>
                                <div className="request-expiry">
                                  <div className="request-expiry-text">
                                    Request expires in {remainingHours} hours
                                  </div>
                                  <TimerProgressBar
                                    totalSeconds={totalHours * 3600}
                                    remainingSeconds={remainingSeconds}
                                    maxWidth={240}
                                    height={5}
                                  />
                                </div>
                              </figure>
                              <div className="request-access-inline">
                                You've been granted profile access.
                              </div>
                              {/* Action Buttons - Updated per design */}
                              <div className="d-flex align-items-center my-4" style={{ gap: '12px', padding: '0 20px' }}>
                                <a
                                  className="view-profile-btn"
                                  onClick={() => {
                                    persistReturnState(conversation);
                                    router.push(
                                      `/user/user-profile/${conversation?.user?.user_name}`
                                    );
                                  }}
                                >
                                  VIEW PROFILE
                                </a>
                                <a
                                  className="reply-btn"
                                  onClick={async () => {
                                    const latestUser = await fetchLatestUser();
                                    const balanceUser = latestUser || authUser;
                                    const chatTokens = balanceUser?.chat_tokens || 0;
                                    const remainingChats = balanceUser?.remaining_chats || 0;
                                    if (
                                      balanceUser?.gender === "female" &&
                                      chatTokens === 0 &&
                                      remainingChats === 0
                                    ) {
                                      showLadiesChatPaywall(remainingHours, true);
                                      return;
                                    }
                                    postApprovedConversation(
                                      conversation?.message?.room_id,
                                      conversation,
                                      remainingHours
                                    );
                                  }}
                                >
                                  REPLY
                                </a>
                              </div>
                              
                              {/* Reject Link - New per design */}
                              <div className="reject-link-container">
                                <a 
                                  className="reject-link"
                                  onClick={() => rejectConversation(conversation)}
                                >
                                  Reject User
                                </a>
                              </div>
                              
                            </div>
                          );
                        })
                    : "No Request yet"
                  : "No Request yet"}
              </Slider>
            </div>
          </Modal>
        )}
      <PaywallModal
        isOpen={paywallConfig.isOpen}
        onClose={closePaywall}
        type={paywallConfig.type}
        expiresIn={paywallConfig.expiresIn}
        userName={paywallConfig.userName}
      />
    </>
  );
};

export default UserCardListForMessage;

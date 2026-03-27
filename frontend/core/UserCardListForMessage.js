import React, { useRef } from "react";
import UserImg from "assets/img/profile.png";
import UserImg3 from "assets/img/user-3.png";
import UserImg4 from "assets/img/user-4.png";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import { CustomIcon } from "core/icon";
import Modal from "react-modal";
import Link from "next/link";
import H5 from "./H5";
import { dateCategory } from "utils/Utilities";
import { IoIosClose } from "react-icons/io";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { HiLockOpen } from "react-icons/hi";
import { useRouter } from "next/router";
import { apiRequest } from "./../utils/Utilities";
import SkeletonUserCardListForMessage from "@/modules/skeleton/SkeletonUserCardListForMessage";
import SkeletonElement from "@/modules/skeleton/SkeletonElement";
import ImageShow from "@/modules/ImageShow";
import useWindowSize from "utils/useWindowSize";
import { logout } from "@/modules/auth/authActions";
import { AUTHENTICATE_UPDATE } from "@/modules/auth/actionConstants";
import { useEffect } from "react";
import StarIcon from "../assets/request star.png";
import TimerProgressBar from "../components/TimerProgressBar";

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
}) => {
  const [modalIsOpen, setIsOpen] = React.useState(false);
  const [dateDetailsIsOpen, setDateDetailsIsOpen] = React.useState(false);
  const [msgModal, setMsgModal] = React.useState(false);
  const [pageLoading, setPageLoading] = React.useState(true);
  const user = useSelector((state) => state.authReducer.user);
  const router = useRouter();
  const growRef = useRef(null);

  useEffect(() => {
    if (modalIsOpen) {
      // stop scrolling page
      document.body.style.overflow = "hidden";
    } else {
      // allow scrolling page
      document.body.style.overflow = "unset";
    }
  }, [modalIsOpen]);

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
  }

  const postApprovedConversation = async (room_id, conversation) => {
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

    // const data = {
    //   chatRoomId: room_id ?? "",
    //   recieverId: conversation?.user?.id ?? "",
    //   message: "",
    // };

    // socket.emit("sendMessage", data);
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
      <div
        onClick={openModal}
        className={`${
          conversations.filter(
            (c) => c.status == 0 && c.message?.sender_id !== user?._id
          )?.length === 0 &&
          selectedTabIndex !== 1 &&
          "request__header"
        }`}
      >
        <span>
          {
            // conversations?.length > 0
            //   ? conversations.filter(
            //       (c) => c.status == 0 && c.message?.sender_id !== user?._id
            //     )?.length > 0 &&
            conversations.filter(
              (c) => c.status == 0 && c.message?.sender_id !== user?._id
            )?.length
            // : ""
          }
        </span>{" "}
        Requests
      </div>

      {!isDesktopView &&
        conversations?.length > 0 &&
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

              <Slider {...settings}>
                {conversations.length > 0
                  ? conversations.filter((c) => c.status == 0)?.length > 0
                    ? conversations
                        .filter((c) => c.status == 0)
                        .map((conversation, index) => {
                          const profilePic =
                            conversation.user?.images?.length > 0
                              ? conversation.user?.images[0]
                              : "";

                          setTimeout(() => {
                            if (profilePic) {
                              setPageLoading(false);
                            }
                          }, 5000);

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
                              {/* <div ">
                                Super
                              </div> */}
                              <div className="request__message__super__text">
                                {isSuper && (
                                  <div className="super">
                                    <CustomIcon.RequestSuperText
                                      color={"white"}
                                      size={150}
                                    />
                                  </div>
                                )}

                                <CustomIcon.IntrestedText
                                  color={"white"}
                                  size={150}
                                />
                              </div>
                              <div
                                className={`superinterested__icon__div ${
                                  isSuper
                                    ? "superinterested__margin"
                                    : ""
                                }`}
                              >
                                {isSuper && (
                                  <div className="superinterested__icon">
                                    <Image
                                      src={StarIcon}
                                      height={53}
                                      width={53}
                                    />
                                  </div>
                                )}

                                <figure style={{ position: 'relative' }}>
                                  <ImageShow
                                    className="requested-profile-img"
                                    max-width={312}
                                    width="95%"
                                    height={320}
                                    src={profilePic}
                                    alt="user image"
                                    placeholderImg="https://i.ibb.co/y8RhMrL/Untitled-design.png"
                                  />
                                  {remainingHours > 0 && (
                                    <div style={{
                                      position: 'absolute',
                                      bottom: '40px',
                                      right: '20px',
                                      background: '#000000',
                                      border: '2px solid #F24462',
                                      borderRadius: '50%',
                                      width: '36px',
                                      height: '36px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontFamily: '"Conv_Helvetica", "Helvetica", Arial, sans-serif',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      color: '#FFFFFF',
                                      zIndex: 10
                                    }}>
                                      {remainingHours}h
                                    </div>
                                  )}
                                  <span className="image_tagline">
                                    "{showText(conversation?.message?.message)}"
                                  </span>
                                </figure>
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
                              </div>
                              <div className="d-flex align-items-center my-4 header_btn_wrap">
                                <a
                                  className="create-date"
                                  style={{
                                    height: "40px",
                                    width: "85%",
                                    marginLeft: "6%",
                                    paddingTop: "2px",
                                  }}
                                  onClick={() => {
                                    if (mobile) {
                                      toggleChat(conversation);
                                    }
                                    postApprovedConversation(
                                      conversation?.message?.room_id,
                                      conversation
                                    );
                                  }}
                                >
                                  START CONVERSATION
                                </a>
                              </div>
                              <div className="my-4 bottom_content">
                                {/* <Link href="/user/user-profile"> */}
                                <a
                                  className="view_profile"
                                  onClick={() =>
                                    router.push(
                                      `/user/user-profile/${conversation?.user?.user_name}`
                                    )
                                  }
                                >
                                  <HiLockOpen />{" "}
                                  <span style={{ textDecoration: "underline" }}>
                                    View Profile
                                  </span>
                                </a>
                                {/* </Link> */}
                                <p>
                                  {conversation?.user?.user_name} has granted
                                  you the access to his profile
                                </p>
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
    </>
  );
};

export default UserCardListForMessage;

import React from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import SubHeading from "@/core/SubHeading";
import UserCardList from "@/core/UserCardList";
import SkeletonDate from "@/modules/skeleton/Dates/SkeletonDates";
import { useState } from "react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import NoImage from "assets/img/no-image.png";
import Image from "next/image";
import { apiRequest } from "utils/Utilities";
import useWindowSize from "utils/useWindowSize";
import { useRef } from "react";
import { toast } from "react-toastify";
import { logout } from "../auth/authActions";
import { useRouter } from "next/router";

function DateAndLocation({
  currentLocationLoading,
  selectedLocation,
  show,
  openPopup,
  closePopup,
  receiverData,
  alreadyMessagedFromUser,
  setAlreadyMessagedFromUser,
  setLocation,
  growDiv,
  searchStatus,
  setLogoutLoading,
}) {
  const [dateLength, setDateLength] = useState(0);
  const [loading, setLoader] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [pagination, setPagination] = React.useState("");
  const [dates, setDates] = React.useState([]);
  const [dateId, setDateId] = React.useState("");
  const { width } = useWindowSize();
  const fetchRequestIdRef = useRef(0);

  const router = useRouter();
  const dispatch = useDispatch();
  const visibleDates = dates.filter((item) => item?.date_status === true);

  useEffect(() => {
    setDateLength(dates?.length);
  }, [dates]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const cards = Array.from(document.querySelectorAll("[data-scroll-card]"));
    if (!cards.length || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.requestAnimationFrame(() => {
              entry.target.classList.add("scrollActive");
              entry.target.classList.remove("scrollHide");
            });
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.15,
      }
    );

    cards.forEach((card) => {
      card.classList.add("scrollHide");
      observer.observe(card);
    });

    return () => {
      observer.disconnect();
    };
  }, [dates.length, currentLocationLoading, loading]);

  const nextPage = () => {
    setTimeout(() => {
      const params = searchStatus
        ? {
            province: selectedLocation?.province?.toLowerCase(),
            prioritize_location: selectedLocation?.city,
            prioritize_province: selectedLocation?.province?.toLowerCase(),
            current_page: page + 1,
            per_page: 10,
          }
        : {
            province: selectedLocation?.province?.toLowerCase(),
            prioritize_location: selectedLocation?.city,
            prioritize_province: selectedLocation?.province?.toLowerCase(),
            current_page: page + 1,
            per_page: 10,
          };

      setPage(page + 1);
      fetchDate(params);
    }, 500);
  };

  const fetchDate = async (params) => {
    const requestId = fetchRequestIdRef.current + 1;
    fetchRequestIdRef.current = requestId;

    try {
      setLoader(true);
      const res = await apiRequest({
        url: "date",
        params: params,
      });
      if (fetchRequestIdRef.current !== requestId) {
        return res;
      }
      const nextDates = Array.isArray(res?.data?.data?.dates)
        ? res.data.data.dates
        : [];
      const currentPage = res?.data?.data?.pagination?.current_page || 1;
      const isFirstPage = currentPage === 1;

      setDates((prevDates) =>
        isFirstPage ? nextDates : [...prevDates, ...nextDates]
      );
      setPagination(res?.data?.data?.pagination);
      setLoader(false);
    } catch (err) {
      if (fetchRequestIdRef.current !== requestId) {
        return err;
      }
      setDates([]);
      setLoader(false);
      if (
        err?.response?.status === 401 &&
        err?.response?.data?.message === "Failed to authenticate token!"
      ) {
        toast.error("Your session has expired. Please login again");
        setLogoutLoading(true);
        setTimeout(() => {
          logout(router, dispatch);
          setLogoutLoading(false);
        }, 2000);
      }
      return err;
    }
  };

  useEffect(() => {
    if (selectedLocation) {
      setDates([]);
      setPage(1);
    }
    if (selectedLocation?.city && !show) {
      const params = searchStatus
        ? {
            province: selectedLocation?.province?.toLowerCase(),
            prioritize_location: selectedLocation?.city,
            prioritize_province: selectedLocation?.province?.toLowerCase(),
            current_page: 1,
            per_page: 10,
          }
        : {
            province: selectedLocation?.province?.toLowerCase(),
            prioritize_location: selectedLocation?.city,
            prioritize_province: selectedLocation?.province?.toLowerCase(),
            current_page: 1,
            per_page: 10,
          };

      fetchDate(params);
    }
  }, [selectedLocation, show]);

  return (
    <InfiniteScroll
      dataLength={dateLength}
      next={() => {
        nextPage();
      }}
      scrollThreshold={0.5}
      hasMore={!loading && pagination?.total_pages !== page}
      style={{ overflowX: "hidden" }}
    >
      <div className="row">
        {currentLocationLoading || (loading && dates.length === 0)
          ? [1, 2, 3, 4, 5, 6].map((n) => (
              <div className={`col-lg-6`}>
                <SkeletonDate key={n} theme="dark" />
              </div>
            ))
          : visibleDates.length > 0
          ? visibleDates.map((item, index) => (
                <div
                  className="col-lg-6"
                  data-scroll-card
                  key={index}
                >
                  {width > 767 ? (
                    <UserCardList
                      setDateId={setDateId}
                      date={item}
                      cardId={`grow-${index}`}
                      openPopup={() => {
                        openPopup(item);
                      }}
                      closePopup={closePopup}
                      dateId={dateId}
                      isDesktopView={true}
                      key={index}
                      loading={loading}
                      setLoader={setLoader}
                      receiverData={receiverData}
                      alreadyMessagedFromUser={alreadyMessagedFromUser}
                      setAlreadyMessagedFromUser={setAlreadyMessagedFromUser}
                    />
                  ) : (
                    <UserCardList
                      setDateId={setDateId}
                      date={item}
                      cardId={`grow-${index}`}
                      openPopup={() => {
                        openPopup(item);
                      }}
                      setLoader={setLoader}
                      closePopup={closePopup}
                      growDiv={growDiv}
                      dateId={dateId}
                      key={index}
                      loading={loading}
                      receiverData={receiverData}
                      alreadyMessagedFromUser={alreadyMessagedFromUser}
                      setAlreadyMessagedFromUser={setAlreadyMessagedFromUser}
                    />
                  )}
                </div>
              ))
          : !loading && (
              <div className="no-message-card-date">
                <figure>
                  <Image src={NoImage} alt="NoImage" width={205} height={140} />
                </figure>
                <h6>Sorry, no dates found for the selected location</h6>
                <SubHeading title="Find a date by changing the location!" />
              </div>
            )}
          {loading &&
            [1, 2, 3, 4, 5, 6].map((n) => (
              <div className={`col-xl-6 col-lg-12`}>
                <SkeletonDate key={n} theme="dark" />
              </div>
            ))}
      </div>
    </InfiniteScroll>
  );
}

export default DateAndLocation;

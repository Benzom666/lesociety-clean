import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { initialize } from "redux-form";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import CreateDateNewHeader from "@/core/CreateDateNewHeader";
import DateWarningModal from "@/modules/date/DateWarningModal";
import ConfirmDate from "@/modules/date/confirmDate";
import MaxDatesReachedPopup from "@/components/popups/MaxDatesReachedPopup";
import { apiRequest } from "utils/Utilities";
import { toast } from "react-toastify";
import { useCreateDateBrowserBack } from "utils/createDateNavigation";
import {
  markCreateDateProgressFromStep,
} from "utils/createDateProgress";
import {
  activateCreateDateFlow,
  persistCreateDateResumePath,
  readCreateDateFlow,
  writeCreateDateFlow,
} from "utils/createDateFlow";
import {
  redirectToCreateDateLimit,
  checkCreateDateLimit,
  useCreateDateAccessGuard,
} from "utils/createDateAccessGuard";
import Loader from "@/modules/Loader/Loader";

function CreateDescription() {
  const NAVIGATION_TIMEOUT_MS = 15000;
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state?.authReducer?.user);
  const [description, setDescription] = useState("");
  const [hideModal, setHideModal] = useState(Boolean(user?.date_warning_popup));
  const [val, setVal] = useState("");
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmPopup, setConfirmPopup] = useState(false);
  const [hasAttemptedNext, setHasAttemptedNext] = useState(false);
  const [hasReachedMinOnce, setHasReachedMinOnce] = useState(false);
  const [hasExceededMaxOnce, setHasExceededMaxOnce] = useState(false);
  const { isCheckingLimit, isLimitBlocked } = useCreateDateAccessGuard({
    router,
    token: user?.token,
    userName: user?.user_name,
    enabled: !router?.query?.new_edit && !router?.query?.edit,
  });
  const textareaRef = useRef(null);
  const isBusy = isSaving || isNavigating;
  const DATE_TYPE_META = {
    MorningBeverage: { label: "Brunch Date", field: "standard_class_date" },
    EveningDate: { label: "Evening Date", field: "standard_class_date" },
    GetSporty: { label: "Get Sporty", field: "middle_class_dates" },
    TakeClass: { label: "Take A Class", field: "middle_class_dates" },
    WineDine: { label: "Wine & Dine", field: "middle_class_dates" },
    BottlesDance: { label: "Bottles & Dance", field: "executive_class_dates" },
    EntertainmentSport: {
      label: "Entertainment & Sports",
      field: "executive_class_dates",
    },
    Entertainmentsports: {
      label: "Entertainment & Sports",
      field: "executive_class_dates",
    },
  };

  const trimmedDescriptionLength = description.trim().length;
  const shouldShowMinError =
    hasAttemptedNext || hasReachedMinOnce;
  const shouldShowMaxError =
    hasAttemptedNext || hasExceededMaxOnce;
  const isDescriptionTooShort =
    shouldShowMinError && trimmedDescriptionLength < 20;
  const isDescriptionTooLong = shouldShowMaxError && description.length > 500;
  const hasDescriptionError = isDescriptionTooShort || isDescriptionTooLong;
  const isDescriptionValid =
    trimmedDescriptionLength >= 20 && description.length <= 500;
  const isNextDisabled = !isDescriptionValid || isBusy;
  const descriptionValidationMessage = isDescriptionTooLong
    ? "Please keep your description to 500 characters or fewer."
    : isDescriptionTooShort
    ? trimmedDescriptionLength === 0
      ? "Please describe your date."
      : "Please provide at least 20 characters."
    : "";
  useCreateDateBrowserBack(router);
  const persistResumePath = (path = router.asPath) => {
    persistCreateDateResumePath(path);
  };
  const toggleConfirm = () => setConfirmPopup((prev) => !prev);
  const handleClosePage = () => {
    persistResumePath();
    router.push("/user/user-list");
  };

  useEffect(() => {
    if (!router.isReady) return;
    const nextFlowMode = router?.query?.new_edit
      ? "edit-existing"
      : router?.query?.edit
      ? "draft-edit"
      : "create";
    const existingFlow = readCreateDateFlow();
    activateCreateDateFlow({
      flowMode: nextFlowMode,
      ...(nextFlowMode !== "create" && existingFlow?.dateId
        ? { dateId: existingFlow.dateId }
        : {}),
    });
  }, [router.isReady, router?.query?.edit, router?.query?.new_edit]);

  useEffect(() => {
    try {
      const savedData = readCreateDateFlow();
      if (savedData && Object.keys(savedData).length) {
        if (savedData.description) {
          setDescription(savedData.description);
          setVal(savedData.description);
        }
      }
    } catch (err) {
      console.error("Error loading from localStorage:", err);
    }
  }, []);

  useEffect(() => {
    router.prefetch("/create-date/review");
  }, [router]);

  useEffect(() => {
    if (!router.isReady) return;
    persistResumePath();
  }, [router.isReady]);

  useEffect(() => {
    if (user?.date_warning_popup && !hideModal) {
      setHideModal(true);
    }
  }, [user?.date_warning_popup, hideModal]);

  useEffect(() => {
    if (hideModal) {
      setShowAnimation(false);
      setShowWarningPopup(false);
    }
  }, [hideModal]);

  useEffect(() => {
    if (showWarningPopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showWarningPopup]);

  useEffect(() => {
    const handleRouteSettled = () => {
      setIsNavigating(false);
      setIsSaving(false);
    };

    router.events.on("routeChangeError", handleRouteSettled);
    router.events.on("routeChangeComplete", handleRouteSettled);

    return () => {
      router.events.off("routeChangeError", handleRouteSettled);
      router.events.off("routeChangeComplete", handleRouteSettled);
    };
  }, [router.events]);

  const handleDescriptionChange = (e) => {
    if (showWarningPopup) {
      e.preventDefault();
      return;
    }

    const nextValue = e.target.value;
    setDescription(nextValue);
    if (hasAttemptedNext) {
      setHasAttemptedNext(false);
    }
    setHasReachedMinOnce((prev) => prev || nextValue.trim().length >= 20);
    setHasExceededMaxOnce((prev) => prev || nextValue.length > 500);
    writeCreateDateFlow({
      flowMode: router?.query?.new_edit
        ? "edit-existing"
        : router?.query?.edit
        ? "draft-edit"
        : "create",
      editMode: Boolean(router?.query?.new_edit),
      description: nextValue,
    });

    setVal(nextValue);
  };

  const handleTextareaIntent = () => {
    if (!hideModal) {
      setShowWarningPopup(true);
      setShowAnimation(true);
      window.requestAnimationFrame(() => {
        textareaRef.current?.blur();
      });
    }
  };

  const handleNext = async () => {
    if (isBusy) return;
    setHasAttemptedNext(true);

    if (!description.trim()) {
      textareaRef.current?.focus();
      return;
    }

    if (description.trim().length < 20) {
      textareaRef.current?.focus();
      return;
    }

    if (description.length > 500) {
      textareaRef.current?.focus();
      return;
    }

    setIsSaving(true);

    let shouldContinueToReview = false;

    try {
      const accessState = await checkCreateDateLimit({
        token: user?.token,
        userName: user?.user_name,
      });

      // Limit check removed - now handled by page-level server-side check

      const parsedData = readCreateDateFlow();
      const isDraftEditFlow =
        !router?.query?.new_edit &&
        (Boolean(router?.query?.edit) ||
          parsedData?.flowMode === "draft-edit" ||
          Boolean(parsedData?.dateId));
      const selectedDateTypeMeta =
        DATE_TYPE_META[parsedData?.selectedDateType] || DATE_TYPE_META.MorningBeverage;
      const cityData = parsedData?.cityData || {};
      const draftPayload = router?.query?.new_edit
        ? null
        : {
            user_name: user?.user_name || user?.username,
            location:
              cityData?.name ||
              parsedData?.city?.split(",")?.[0]?.trim() ||
              user?.location ||
              "",
            province:
              cityData?.province?.[0]?.short_code?.split("-")[1] ||
              cityData?.province?.[0]?.short_code ||
              parsedData?.city?.split(",")?.[1]?.trim() ||
              user?.province ||
              "",
            country:
              cityData?.country?.[0]?.text || user?.country || "",
            country_code:
              cityData?.country?.[0]?.short_code || user?.country_code || "",
            date_length:
              parsedData?.selectedDurationValue || parsedData?.selectedDuration || "",
            price: parsedData?.selectedPrice,
            image_index:
              typeof parsedData?.image_index === "number" ? parsedData.image_index : 0,
            date_details: description,
            date_status: false,
            [selectedDateTypeMeta.field]: selectedDateTypeMeta.label,
          };

      const createDraft = async () =>
        apiRequest({
          method: "POST",
          url: "date",
          data: draftPayload,
          token: user?.token,
          timeout: 45000,
        });

      if (!router?.query?.new_edit) {
        const missingDraftFields = [
          ["username", draftPayload?.user_name],
          ["city", draftPayload?.location],
          ["country", draftPayload?.country],
          ["country code", draftPayload?.country_code],
          ["duration", draftPayload?.date_length],
          ["price", draftPayload?.price],
          ["description", draftPayload?.date_details],
        ]
          .filter(([, value]) => value === undefined || value === null || value === "")
          .map(([field]) => field);

        if (missingDraftFields.length) {
          throw new Error(`Missing required fields: ${missingDraftFields.join(", ")}`);
        }

        let draftResponse;

        if (parsedData?.dateId) {
          try {
            draftResponse = await apiRequest({
              method: "POST",
              url: "date/update",
              data: {
                ...draftPayload,
                date_id: parsedData.dateId,
              },
              token: user?.token,
              timeout: 45000,
            });
          } catch (err) {
            if (err?.response?.status !== 404) {
              throw err;
            }

            draftResponse = await createDraft();
          }
        } else {
          draftResponse = await createDraft();
        }

        const persistedDateId =
          draftResponse?.data?.data?._id ||
          draftResponse?.data?.data?.date?._id;

        if (!persistedDateId) {
          throw new Error("Draft id missing after save.");
        }

        parsedData.dateId = persistedDateId;
      }

      const updatedData = {
        ...parsedData,
        flowMode: router?.query?.new_edit
          ? "edit-existing"
          : isDraftEditFlow
          ? "draft-edit"
          : "create",
        editMode: Boolean(router?.query?.new_edit),
        description,
        dateId: parsedData?.dateId,
      };
      writeCreateDateFlow(updatedData);
      shouldContinueToReview = true;

      dispatch(
        initialize("CreateStepFour", {
          date_description: description,
        })
      );
    } catch (err) {
      console.error("Error preparing date preview:", err);
      const isTimeoutError =
        err?.code === "ECONNABORTED" ||
        err?.message?.toLowerCase?.().includes("timeout");
      const isConnectionError =
        err?.code === "ECONNREFUSED" ||
        err?.code === "ECONNRESET" ||
        err?.message?.includes("Network Error") ||
        !err?.response;
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.data?.error ||
        err?.message ||
        "Could not prepare your preview. Please try again.";
      const isLimitError =
        err?.response?.status === 403 &&
        /limit|reached/i.test(String(errorMessage));

      if (isLimitError) {
        toast.error(errorMessage);
        setIsSaving(false);
        redirectToCreateDateLimit(router);
        return;
      }

      if (!router?.query?.new_edit && (isTimeoutError || isConnectionError)) {
        const parsedData = readCreateDateFlow();
        const fallbackUpdatedData = {
          ...parsedData,
          flowMode: router?.query?.edit
            ? "draft-edit"
            : parsedData?.flowMode || "create",
          editMode: false,
          description,
        };
        writeCreateDateFlow(fallbackUpdatedData);
        dispatch(
          initialize("CreateStepFour", {
            date_description: description,
          })
        );
        shouldContinueToReview = true;
      } else {
        toast.error(errorMessage);
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    if (!shouldContinueToReview) {
      toast.error("Could not prepare your preview. Please try again.");
      return;
    }
    markCreateDateProgressFromStep(4);
    setIsNavigating(true);

    try {
      const nextRoute =
        router?.query?.new_edit
          ? "/create-date/review?new_edit=true"
          : router?.query?.edit
          ? "/create-date/review?edit=true"
          : "/create-date/review";
      const didNavigate = await Promise.race([
        router.push(nextRoute),
        new Promise((resolve) => {
          window.setTimeout(() => resolve(false), NAVIGATION_TIMEOUT_MS);
        }),
      ]);
      if (!didNavigate) {
        setIsNavigating(false);
        toast.error("Could not open the preview page. Please try again.");
      }
    } catch (error) {
      setIsNavigating(false);
    }
  };

  if (isLimitBlocked) {
    return (
      <MaxDatesReachedPopup
        isOpen={true}
        onClose={() => router.push("/user/user-list")}
      />
    );
  }

  // Removed unnecessary loader - isCheckingLimit shouldn't block page rendering during flow navigation

  return (
    <>
    <div className="create-date-page">
      {showWarningPopup && (
        <DateWarningModal
          setHideModal={setHideModal}
          showAnimation={showAnimation}
        />
      )}
      <CreateDateNewHeader
        activeStep={4}
        onBack={() => {
          markCreateDateProgressFromStep(4);
          if (router?.query?.new_edit) {
            router.push("/user/user-profile");
            return;
          }
          router.push(
            router?.query?.new_edit
              ? "/create-date/duration?new_edit=true"
              : router?.query?.edit
              ? "/create-date/duration?edit=true"
              : "/create-date/duration"
          );
        }}
        onClose={toggleConfirm}
      />

      <div className="create-date-content">
        <h1 className="page-title">Make him want this date.</h1>
        <p className="page-subtitle">
          Tell him why this night with you is unforgettable. Your vibe, your
          energy, what he can expect.
        </p>

        <div className="form-section">
          <textarea
            ref={textareaRef}
            value={description}
            onChange={handleDescriptionChange}
            onFocus={handleTextareaIntent}
            onClick={handleTextareaIntent}
            placeholder="I love deep conversations over great wine... I'm playful, classy, and always up for an adventure. Expect laughter, real connection, and a night that feels effortless."
            className={`description-textarea ${hasDescriptionError ? "description-textarea-error" : ""}`}
          />
          {descriptionValidationMessage && (
            <div className="description-inline-error">
              {descriptionValidationMessage}
            </div>
          )}
          <div className="character-count">
            {description.length}/500 characters
          </div>
        </div>
      </div>

      <div className="bottom-button-container">
        <button
          className={`next-button ${isNextDisabled ? "disabled" : ""}`}
          onClick={handleNext}
          disabled={isNextDisabled}
          aria-busy={isBusy}
        >
          <span className={isBusy ? "button-label-hidden" : ""}>NEXT</span>
          {isBusy && <span className="button-spinner"><span className="spin-loader-button"></span></span>}
        </button>
      </div>

      <style jsx>{`
        .create-date-page {
          min-height: 100vh;
          background: #000000;
          display: flex;
          flex-direction: column;
        }

        .create-date-content {
          flex: 1;
          padding: 24px 16px;
          overflow-y: auto;
          padding-bottom: 120px;
        }

        .page-title {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, sans-serif;
          font-size: 28px;
          font-weight: 600;
          line-height: 1.15;
          color: #FFFFFF;
          text-align: center;
          text-wrap: balance;
          max-width: 36ch;
          margin: 0 auto 12px;
        }

        .page-subtitle {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, sans-serif;
          font-size: 16px;
          font-weight: 400;
          color: #CCCCCC;
          text-align: center;
          margin: 0 0 32px 0;
        }

        .form-section {
          background: transparent;
          border: none;
          padding: 0;
        }

        .description-textarea {
          width: 100%;
          min-height: 220px;
          padding: 20px;
          font-size: 15px;
          background: transparent;
          color: #FFFFFF;
          border: 1px solid #333333;
          border-radius: 16px;
          resize: vertical;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, sans-serif;
          line-height: 1.6;
          margin-bottom: 12px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .description-textarea:focus {
          outline: none;
          border-color: #666666;
          box-shadow: none;
        }

        .description-textarea.description-textarea-error,
        .description-textarea.description-textarea-error:focus {
          border-color: #F24462;
          box-shadow: 0 0 20px rgba(242, 68, 98, 0.15);
        }

        .description-textarea::placeholder {
          color: #666666;
        }

        .character-count {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, sans-serif;
          font-size: 12px;
          color: #999999;
          text-align: right;
          margin-bottom: 24px;
        }

        .description-inline-error {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, sans-serif;
          font-size: 13px;
          line-height: 1.4;
          color: #ff5c91;
          margin: -2px 0 12px;
        }

        .bottom-button-container {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px;
          background: #000000;
          display: flex;
          justify-content: center;
        }

        .next-button {
          width: 100%;
          max-width: 420px;
          height: 52px;
          background: #F24462;
          border: 1px solid #F24462;
          border-radius: 12px;
          color: #FFFFFF;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, sans-serif;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
        }

        .next-button:hover:not(.disabled) {
          background: #E2466B;
        }

        .next-button.disabled {
          background: #1A1A1A;
          border-color: #1A1A1A;
          color: #666666;
          cursor: not-allowed;
          box-shadow: none;
        }

        .button-label-hidden {
          visibility: hidden;
        }

        .button-spinner {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .next-button :global(.spin-loader-button) {
          margin: 0;
        }
        .arrow-icon {
          font-size: 18px;
        }

        @media (min-width: 768px) {
          .create-date-content {
            padding: 40px 32px;
            max-width: 600px;
            margin: 0 auto;
          }

          .page-title {
            font-size: 36px;
          }

          .page-subtitle {
            font-size: 18px;
            margin-bottom: 40px;
          }

          .form-section {
            padding: 0;
          }

          .bottom-button-container {
            padding: 24px 32px;
          }

          .next-button {
            height: 56px;
            font-size: 18px;
            max-width: 600px;
          }
        }
      `}</style>
    </div>
    <ConfirmDate
      isOpen={confirmPopup}
      toggle={toggleConfirm}
      onClosePage={handleClosePage}
    />
    </>
  );
}

export default CreateDescription;

export { createDateLimitServerSideProps as getServerSideProps } from "utils/createDateAccessGuard";

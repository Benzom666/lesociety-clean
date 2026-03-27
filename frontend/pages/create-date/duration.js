import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { initialize } from "redux-form";
import { useDispatch } from "react-redux";
import CreateDateNewHeader from "@/core/CreateDateNewHeader";
import ConfirmDate from "@/modules/date/confirmDate";
import MaxDatesReachedPopup from "@/components/popups/MaxDatesReachedPopup";
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
import { useCreateDateAccessGuard } from "utils/createDateAccessGuard";
import { useSelector } from "react-redux";
import Loader from "@/modules/Loader/Loader";

const DURATION_OPTIONS = [
  { 
    label: "1-2 hours", 
    value: "1-2 hours",
    description: "A quick drink or coffee."
  },
  { 
    label: "2-3 hours", 
    value: "2-3 hours",
    description: "Dinner and a relaxed evening."
  },
  { 
    label: "3-4 hours", 
    value: "3-4 hours",
    description: "Dinner + drinks or a show."
  },
  { 
    label: "Full evening (4+ hours)", 
    value: "Full evening (4+ hours)",
    description: "Let the night unfold beautifully."
  },
  { 
    label: "Flexible – lets see where it take us", 
    value: "Flexible – lets see where it take us",
    description: ""
  },
];

function CreateDuration() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state?.authReducer?.user);
  const [selectedDuration, setSelectedDuration] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [confirmPopup, setConfirmPopup] = useState(false);
  const { isCheckingLimit, isLimitBlocked } = useCreateDateAccessGuard({
    router,
    token: user?.token,
    userName: user?.user_name,
    enabled: !router?.query?.new_edit && !router?.query?.edit,
  });
  useCreateDateBrowserBack(router);
  const durationValueMap = {
    "1-2 hours": "1/2H",
    "2-3 hours": "1H",
    "3-4 hours": "2H",
    "Full evening (4+ hours)": "3H",
    "Flexible – lets see where it take us": "3H",
  };
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
    if (!router.isReady) return;
    if (!router?.query?.new_edit) return;

    router.replace("/create-date/description?new_edit=true");
  }, [router, router.isReady, router?.query?.new_edit]);

  useEffect(() => {
    try {
      const savedData = readCreateDateFlow();
      if (savedData && Object.keys(savedData).length) {
        if (savedData.selectedDuration) {
          setSelectedDuration(savedData.selectedDuration);
        } else if (savedData.selectedDurationValue) {
          const displayValue =
            Object.keys(durationValueMap).find(
              (key) => durationValueMap[key] === savedData.selectedDurationValue
            ) || "";
          setSelectedDuration(displayValue);
        }
      }
    } catch (err) {
      console.error("Error loading from localStorage:", err);
    }
  }, []);

  useEffect(() => {
    router.prefetch("/create-date/description");
  }, [router]);

  useEffect(() => {
    if (!router.isReady) return;
    persistResumePath();
  }, [router.isReady]);

  useEffect(() => {
    if (!selectedDuration) return;
    writeCreateDateFlow({
      flowMode: router?.query?.new_edit
        ? "edit-existing"
        : router?.query?.edit
        ? "draft-edit"
        : "create",
      editMode: Boolean(router?.query?.new_edit),
      selectedDuration,
      selectedDurationValue: durationValueMap[selectedDuration] || selectedDuration,
    });
  }, [selectedDuration]);

  const handleNext = async () => {
    if (!selectedDuration) return;

    writeCreateDateFlow({
      selectedDuration,
      selectedDurationValue: durationValueMap[selectedDuration] || selectedDuration,
    });

    dispatch(
      initialize("CreateStepThree", {
        education: durationValueMap[selectedDuration] || selectedDuration,
      })
    );

    markCreateDateProgressFromStep(3);
    setIsNavigating(true);

    try {
      await router.push(
        router?.query?.new_edit
          ? "/create-date/description?new_edit=true"
          : router?.query?.edit
          ? "/create-date/description?edit=true"
          : "/create-date/description"
      );
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
      <CreateDateNewHeader
        activeStep={3}
        onBack={() => {
          markCreateDateProgressFromStep(3);
          if (router?.query?.new_edit) {
            router.push("/create-date/description?new_edit=true");
            return;
          }
          router.push(
            router?.query?.new_edit
              ? "/create-date/date-event?new_edit=true"
              : router?.query?.edit
              ? "/create-date/date-event?edit=true"
              : "/create-date/date-event"
          );
        }}
        onClose={toggleConfirm}
      />

      <div className="create-date-content">
        <h1 className="page-title">How long do you want this date to last?</h1>
        <p className="page-subtitle">
          Be upfront — great dates start with perfect timing.
        </p>

        <div className="duration-grid">
          {DURATION_OPTIONS.map((option) => {
            const isSelected = selectedDuration === option.value;
            return (
              <button
                key={option.value}
                className={`duration-card ${isSelected ? "selected" : ""}`}
                onClick={() => setSelectedDuration(option.value)}
              >
                <div className="duration-label">{option.label}</div>
                {option.description && (
                  <div className="duration-description">{option.description}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bottom-button-container">
        <button
          className={`next-button ${
            !selectedDuration || isNavigating ? "disabled" : ""
          }`}
          onClick={handleNext}
          disabled={!selectedDuration || isNavigating}
          aria-busy={isNavigating}
        >
          <span className={isNavigating ? "button-label-hidden" : ""}>NEXT</span>
          {isNavigating && <span className="button-spinner"><span className="spin-loader-button"></span></span>}
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

        .duration-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .duration-card {
          background: transparent;
          border: 1px solid #333333;
          border-radius: 16px;
          padding: 24px 20px;
          color: #FFFFFF;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, sans-serif;
          text-align: left;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .duration-card:hover {
          border-color: #F24462;
          transform: translateY(-2px);
        }

        .duration-card.selected {
          background: rgba(242, 68, 98, 0.05);
          border: 2px solid #F24462;
          box-shadow: 0 0 20px rgba(242, 68, 98, 0.2);
        }

        .duration-label {
          font-size: 17px;
          font-weight: 600;
          color: #FFFFFF;
        }

        .duration-card.selected .duration-label {
          color: #FFFFFF;
        }

        .duration-description {
          font-size: 13px;
          font-weight: 400;
          color: #999999;
          line-height: 1.4;
        }

        .duration-card.selected .duration-description {
          color: #CCCCCC;
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

          .duration-grid {
            gap: 16px;
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

export default CreateDuration;

export { createDateLimitServerSideProps as getServerSideProps } from "utils/createDateAccessGuard";

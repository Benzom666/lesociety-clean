import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { initialize } from "redux-form";
import { useDispatch, useSelector } from "react-redux";
import CreateDateNewHeader from "@/core/CreateDateNewHeader";
import { apiRequest } from "utils/Utilities";
import { toast } from "react-toastify";
import { useCreateDateBrowserBack } from "utils/createDateNavigation";
import {
  markCreateDateProgressFromStep,
} from "utils/createDateProgress";
import ConfirmDate from "@/modules/date/confirmDate";
import MaxDatesReachedPopup from "@/components/popups/MaxDatesReachedPopup";
import {
  activateCreateDateFlow,
  persistCreateDateResumePath,
  readCreateDateFlow,
  writeCreateDateFlow,
} from "utils/createDateFlow";
import { useCreateDateAccessGuard } from "utils/createDateAccessGuard";
import Loader from "@/modules/Loader/Loader";

const PRICE_OPTIONS = [80, 100, 150, 200, 300, 400, 500, 750, 1000];

function CreateStepTwo() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state?.authReducer?.user);

  const [categories, setCategories] = useState([]);
  const [aspirations, setAspirations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedAspiration, setSelectedAspiration] = useState("");
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [confirmPopup, setConfirmPopup] = useState(false);
  const { isCheckingLimit, isLimitBlocked } = useCreateDateAccessGuard({
    router,
    token: user?.token,
    userName: user?.user_name,
    enabled: !router?.query?.new_edit && !router?.query?.edit,
  });
  useCreateDateBrowserBack(router);
  const hasLockedSelection = Boolean(user?.categatoryId && user?.aspirationId);
  const isSelectionLocked =
    hasLockedSelection &&
    user?.first30DaysDateCreateTime &&
    new Date(user.first30DaysDateCreateTime).getTime() +
      30 * 24 * 60 * 60 * 1000 -
      new Date().getTime() >
      0;
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

  // Load saved data on mount
  useEffect(() => {
    const saved = readCreateDateFlow() || {};
    const initialCategory = saved?.selectedCategory || user?.categatoryId || "";
    const initialAspiration =
      saved?.selectedAspiration || user?.aspirationId || "";
    const initialPrice = saved?.selectedPrice || null;

    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
    if (initialAspiration) {
      setSelectedAspiration(initialAspiration);
    }
    if (initialPrice) {
      setSelectedPrice(initialPrice);
    }
  }, [user?.aspirationId, user?.categatoryId, user?.token]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiRequest({
          method: "GET",
          url: `categories`,
          token: user?.token,
        });

        const cats = res.data?.data?.map((cat) => ({
          label: cat?.name,
          value: cat?._id,
        })) || [];
        setCategories(cats);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        toast.error("Failed to load categories");
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    router.prefetch("/create-date/duration");
  }, [router]);

  useEffect(() => {
    if (!router.isReady) return;
    persistResumePath();
  }, [router.isReady]);

  useEffect(() => {
    writeCreateDateFlow({
      flowMode: router?.query?.new_edit
        ? "edit-existing"
        : router?.query?.edit
        ? "draft-edit"
        : "create",
      editMode: Boolean(router?.query?.new_edit),
      selectedCategory,
      selectedAspiration,
      selectedPrice,
    });
  }, [selectedAspiration, selectedCategory, selectedPrice]);

  // Fetch aspirations when category changes
  useEffect(() => {
    const fetchAspirations = async () => {
      if (selectedCategory) {
        try {
          const res = await apiRequest({
            method: "GET",
            url: `aspirations?category_id=${selectedCategory}`,
            token: user?.token,
          });

          const asps = res.data?.data?.map((asp) => ({
            label: asp?.name,
            value: asp?._id,
          })) || [];
          setAspirations(asps);
          setSelectedAspiration((currentValue) => {
            if (!currentValue) return currentValue;
            return asps.some((asp) => asp.value === currentValue)
              ? currentValue
              : "";
          });
        } catch (err) {
          console.error("Failed to fetch aspirations:", err);
        }
      } else {
        setAspirations([]);
      }
    };

    fetchAspirations();
  }, [selectedCategory, user?.token]);

  const handleNext = async () => {
    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }
    if (!selectedAspiration) {
      toast.error("Please select an aspiration");
      return;
    }
    if (!selectedPrice) {
      toast.error("Please select a price");
      return;
    }

    const selectedCategoryMeta = categories.find(
      (item) => item.value === selectedCategory
    );
    const selectedAspirationMeta = aspirations.find(
      (item) => item.value === selectedAspiration
    );

    if (!isSelectionLocked) {
      try {
        await apiRequest({
          data: {
            categatoryName: selectedCategoryMeta?.label,
            aspirationName: selectedAspirationMeta?.label,
            aspirationId: selectedAspirationMeta?.value,
            categatoryId: selectedCategoryMeta?.value,
          },
          method: "POST",
          url: "user/save-aspiration",
          token: user?.token,
        });

        if (user?.user_name) {
          const res = await apiRequest({
            method: "GET",
            url: `user/user-by-name?user_name=${user?.user_name}`,
            token: user?.token,
          });
          dispatch({
            type: "AUTHENTICATE_UPDATE",
            payload: { ...res.data?.data?.user },
          });
        }
      } catch (err) {
        toast.error(
          err?.response?.data?.message ||
            "Failed to save aspiration. Please try again."
        );
        return;
      }
    }

    writeCreateDateFlow({
      selectedCategory,
      selectedAspiration,
      selectedPrice,
      selectedCategoryName: selectedCategoryMeta?.label || "",
      selectedAspirationName: selectedAspirationMeta?.label || "",
    });

    dispatch(
      initialize("CreateStepTwo", {
        education: selectedPrice,
        enter__category: selectedCategory,
        enter__aspiration: selectedAspiration,
      })
    );

    markCreateDateProgressFromStep(2);
    setIsNavigating(true);

    try {
      await router.push(
        router?.query?.new_edit
          ? "/create-date/duration?new_edit=true"
          : router?.query?.edit
          ? "/create-date/duration?edit=true"
          : "/create-date/duration"
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

  if (!router?.query?.new_edit && isCheckingLimit) {
    return <Loader />;
  }

  return (
    <>
    <div className="create-date-page">
      <CreateDateNewHeader
        activeStep={2}
        onBack={() => {
          markCreateDateProgressFromStep(2);
          router.push(
            router?.query?.new_edit
              ? "/create-date/choose-date-type?new_edit=true"
              : router?.query?.edit
              ? "/create-date/choose-date-type?edit=true"
              : "/create-date/choose-date-type"
          );
        }}
        onClose={toggleConfirm}
      />

      <div className="create-date-content">
        <h1 className="page-title">Your aspiration. Your price.</h1>
        <p className="page-subtitle">
          When a man chooses <strong>Super Interested</strong>, he's saying: I'll cover the outing and financially support your aspiration to skip straight to our first date - Fast.
        </p>

        <div className="two-column-layout">
          {/* Left Column - Category & Aspiration */}
          <div className="left-column">
            <div className="form-section">
              <label className="section-label">
                1. Who do you aspire to be?
              </label>
              <label className="section-sublabel">
                Your selection will be locked for 30 days
              </label>

              {/* Category Selection - DROPDOWN */}
              <select
                value={selectedCategory || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedCategory(value);
                  setSelectedAspiration("");
                }}
                className="custom-select"
              >
                <option value="">Select A Category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>

              {/* Aspiration Selection - DROPDOWN */}
              {selectedCategory && (
                <>
                  <label className="section-label secondary">
                    Select Your Aspiration
                  </label>
                  <select
                    value={selectedAspiration || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedAspiration(value);
                    }}
                    disabled={!selectedCategory}
                    className="custom-select"
                  >
                    <option value="">Select Your Aspiration</option>
                    {aspirations.map((asp) => (
                      <option key={asp.value} value={asp.value}>
                        {asp.label}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Price */}
          <div className="right-column">
            <div className="form-section">
              <label className="section-label">
                2. Set your suggested financial gift
              </label>
              <p className="section-description">
                He hands you the gift in person on the date to help support
                your goals. Showing his commitment.
              </p>
              <div className="price-grid">
                {PRICE_OPTIONS.map((price) => {
                  const isSelected = selectedPrice === price;
                  return (
                    <button
                      type="button"
                      key={price}
                      className={`price-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedPrice(price)}
                    >
                      ${price}
                    </button>
                  );
                })}
              </div>
              <p className="pro-tip">
                Pro tip: Women who post multiple dates at different price
                points get 3-5x more Super Interested offers.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-button-container">
        <button
          className={`next-button ${
            !selectedPrice || !selectedAspiration || isNavigating
              ? "disabled"
              : ""
          }`}
          onClick={handleNext}
          disabled={!selectedPrice || !selectedAspiration || isNavigating}
          aria-busy={isNavigating}
        >
          <span className={`button-label ${isNavigating ? "button-label-hidden" : ""}`}>
            NEXT
          </span>
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

        @media (min-width: 768px) {
          .create-date-content {
            padding: 40px 32px;
            padding-bottom: 140px;
          }

          .page-title {
            font-size: 28px;
            margin-bottom: 16px;
          }

          .page-subtitle {
            font-size: 14px;
            margin-bottom: 48px;
          }

          .section-label {
            font-size: 18px;
          }

          .price-card {
            padding: 20px 16px;
            font-size: 18px;
          }
        }

        .page-title {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, sans-serif;
          font-size: 20px;
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
          font-size: 13px;
          font-weight: 400;
          color: #CCCCCC;
          text-align: center;
          margin: 0 auto 32px;
          max-width: 500px;
          line-height: 1.5;
        }

        .page-subtitle strong {
          color: #FFFFFF;
          font-weight: 600;
        }

        .two-column-layout {
          display: flex;
          flex-direction: column;
          gap: 32px;
          max-width: 900px;
          margin: 0 auto;
        }

        .left-column,
        .right-column {
          flex: 1;
          min-width: 0;
        }

        .form-section {
          background: transparent;
          border: none;
          padding: 0;
        }

        .section-label {
          display: block;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #FFFFFF;
          margin-bottom: 6px;
        }

        .section-label.secondary {
          margin-top: 16px;
        }

        .section-sublabel {
          display: block;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: #999999;
          margin-bottom: 16px;
        }

        .section-description {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: #CCCCCC;
          line-height: 1.5;
          margin: 0 0 16px 0;
        }

        .custom-select {
          width: 100%;
          padding: 14px 16px;
          font-size: 16px;
          background: #000000;
          color: #FFFFFF;
          border: 1px solid #333333;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 12px;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, sans-serif;
        }

        .custom-select:focus {
          outline: none;
          border-color: #F24462;
        }

        .custom-select option {
          background: #000000;
          color: #FFFFFF;
        }

        .price-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .price-card {
          background: transparent;
          border: 1px solid #333333;
          border-radius: 10px;
          padding: 18px 12px;
          color: #FFFFFF;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, sans-serif;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .price-card:hover {
          border-color: #F24462;
          transform: translateY(-2px);
        }

        .price-card.selected {
          background: #F24462;
          border: 2px solid #F24462;
          color: #FFFFFF;
        }

        .pro-tip {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: #999999;
          line-height: 1.5;
          margin: 16px 0 0 0;
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
          height: 48px;
          background: #F24462;
          border: 1px solid #F24462;
          border-radius: 8px;
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

        .arrow-icon {
          font-size: 18px;
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

        .next-button:hover:not(.disabled) {
          background: #E2466B;
        }

        .next-button.disabled {
          background: #333333;
          border-color: #333333;
          color: #666666;
          cursor: not-allowed;
        }

        .next-button :global(.spin-loader-button) {
          margin: 0;
        }

        .next-button :global(.spin-loader-button) {
          margin: 0;
        }

        @media (min-width: 768px) {
          .create-date-content {
            padding: 40px 32px;
            max-width: 1000px;
            margin: 0 auto;
          }

          .page-title {
            font-size: 28px;
            margin-bottom: 16px;
          }

          .page-subtitle {
            font-size: 14px;
            margin-bottom: 48px;
          }

          .two-column-layout {
            flex-direction: row;
            gap: 64px;
          }

          .left-column,
          .right-column {
            flex: 1;
          }

          .section-label {
            font-size: 18px;
          }

          .form-section {
            padding: 0;
          }

          .price-card {
            padding: 20px 16px;
            font-size: 18px;
          }

          .bottom-button-container {
            padding: 24px 32px;
          }

          .next-button {
            height: 56px;
            font-size: 18px;
            max-width: 1000px;
            margin: 0 auto;
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

export default CreateStepTwo;

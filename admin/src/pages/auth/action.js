import Utils from "../../utility";
import axios from 'axios';
export const onSubmit = (values, navigate) => {
  return (dispatch) => {
    const { email, password } = values;
    const dataToSend = {
      email,
      password,
    };
    Utils.api.postApiCall(
      Utils.endPoints.login,
      dataToSend,
      (respData) => {
        const token = respData?.data?.data?.data?.token;
        dispatch({
          type: "GET_TOKEN",
          payload: { token },
        });
        localStorage.setItem("accessToken", token);
        setTimeout(() => {
          // navigate("/dashboard");
          window.location = "/dashboard";
        }, 100)
      },
      (error) => {
        let { data } = error;
        Utils.showAlert(2, data?.message);
        // setSubmitting(true);
      }
    );
  };
};

export const forgotPassword = (values, navigate, sendEmailSend) => {
  return (dispatch) => {
    const { email, password } = values;
    const dataToSend = {
      email,
      password,
    };
    const axiosFunc =  axios.create({
      timeout: 100000,
      baseURL: "https://api.lesociety.com/api/v1/",
      // baseURL: `https://staging.liviaapp.com/api`,
      // baseURL: `https://usa.liviaapp.com/api`,
      // baseURL: "https://usa.liviaapp.com/api",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
      },
    })
    Utils.api.postApiCall(
      Utils.endPoints.forgotPassword,
      dataToSend,
      (respData) => {
        sendEmailSend(true);
        // navigate("/dashboard");
      },
      (error) => {
        let { data } = error;
        Utils.showAlert(2, data?.message);
        // setSubmitting(true);
      }
    );
  };
};

export const resetPassword = (values, navigate, token) => {
  return (dispatch) => {
    const { password } = values;
    const dataToSend = {
      password,
    };
    Utils.api.postApiCall(
      Utils.endPoints.resetPassword + `?token=${token}`,
      dataToSend,
      (respData) => {
        // navigate("/dashboard");
      },
      (error) => {
        let { data } = error;

        Utils.showAlert(2, data?.message);
        // setSubmitting(true);
      }
    );
  };
};

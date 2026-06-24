import Swal from "sweetalert2";

const SwalToast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
  customClass: {
    popup: "swal-premium-toast",
  },
});

export const toast = {
  success: (message: string) => {
    SwalToast.fire({
      icon: "success",
      title: message,
    });
  },
  error: (message: string) => {
    SwalToast.fire({
      icon: "error",
      title: message,
    });
  },
  info: (message: string) => {
    SwalToast.fire({
      icon: "info",
      title: message,
    });
  },
  warning: (message: string) => {
    SwalToast.fire({
      icon: "warning",
      title: message,
    });
  },
};

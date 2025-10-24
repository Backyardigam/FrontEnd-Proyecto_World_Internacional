import React from "react";

const Asiento = React.memo(({ num_asiento, className, ...props }) => {
  return (
    <>
      <svg
        width="36"
        height="33"
        viewBox="0 0 36 33"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
      >
        <path
          d="M11 29C6.89949 29 0.5 29 0.5 29V4C0.5 4 6.89949 4 11 4M11 29C11 32.5 12.5 32.5 12.5 32.5C12.5 32.5 24.3848 32.5 32 32.5C36 32.5 36 0.5 32 0.5C24.3848 0.5 12.5 0.5 12.5 0.5C12.5 0.5 11 0.499999 11 4M11 29C11 25.5 12.5 25.5 12.5 25.5C12.5 25.5 20.1184 25.5 25 25.5C27.5 25.5 27.5 7.5 25 7.5C20.1184 7.5 12.5 7.5 12.5 7.5C12.5 7.5 11 7.5 11 4"
          stroke="currentColor"
        />
      </svg>
      <span className="absolute -translate-x-2/3 -translate-y-9/7 text-sm">{num_asiento}</span>
    </>
  );
});

export default Asiento;

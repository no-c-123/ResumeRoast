import React from 'react';

const Loader = () => {
  return (
    <>
      <style jsx>{`
        @keyframes text_713 {
          0% {
            letter-spacing: 1px;
            transform: translateX(0px);
          }
          40% {
            letter-spacing: 2px;
            transform: translateX(26px);
          }
          80% {
            letter-spacing: 1px;
            transform: translateX(32px);
          }
          90% {
            letter-spacing: 2px;
            transform: translateX(0px);
          }
          100% {
            letter-spacing: 1px;
            transform: translateX(0px);
          }
        }

        @keyframes loading_713 {
          0% {
            width: 16px;
            transform: translateX(0px);
          }
          40% {
            width: 100%;
            transform: translateX(0px);
          }
          80% {
            width: 16px;
            transform: translateX(64px);
          }
          90% {
            width: 100%;
            transform: translateX(0px);
          }
          100% {
            width: 16px;
            transform: translateX(0px);
          }
        }

        @keyframes loading2_713 {
          0% {
            transform: translateX(0px);
            width: 16px;
          }
          40% {
            transform: translateX(0%);
            width: 80%;
          }
          80% {
            width: 100%;
            transform: translateX(0px);
          }
          90% {
            width: 80%;
            transform: translateX(15px);
          }
          100% {
            transform: translateX(0px);
            width: 16px;
          }
        }

        .loader-text {
          animation: text_713 3.5s ease both infinite;
        }

        .load {
          animation: loading_713 3.5s ease both infinite;
        }

        .load::before {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          background-color: #FF3E1F;
          border-radius: inherit;
          animation: loading2_713 3.5s ease both infinite;
        }
      `}</style>
      <div className='w-full h-full absolute flex justify-center items-center mb-4'>
        <div className="w-20 h-[50px] absolute">
            <span className="loader-text absolute top-0 p-0 m-0 text-orange-300 text-xs tracking-wide">
            loading
            </span>
            <span className="load bg-orange-500 rounded-[50px] block h-4 w-4 bottom-0 absolute translate-x-16" />
        </div>
      </div>
    </>
  );
}

export default Loader;

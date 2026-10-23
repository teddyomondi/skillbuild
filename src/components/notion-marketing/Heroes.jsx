const Heroes = () => {
  return (
    <div className="h-full flex flex-col max-w-5xl items-center justify-center">
      <div className="relative w-[340px] h-[250px] sm:w-[350px] sm:h-[220px] md:w-[500px] md:h-[380px] flex items-center justify-center">
        <img
          src="/notion-home.webp"
          alt="Document"
          className="w-full h-full object-contain dark:invert"
        />
      </div>
    </div>
  );
};

export default Heroes;

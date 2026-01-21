interface MainPageTitleSectionProps {
  title: string;
  description: string;
}

const MainPageTitleSection = ({
  title,
  description,
}: MainPageTitleSectionProps) => {
  return (
    <div className="text-center mb-12">
      <h2 className="text-4xl font-bold text-slate-900">{title}</h2>
      <p className="mt-4 text-slate-600 text-xl max-w-2xl mx-auto">
        {description}
      </p>
    </div>
  );
};

export default MainPageTitleSection;

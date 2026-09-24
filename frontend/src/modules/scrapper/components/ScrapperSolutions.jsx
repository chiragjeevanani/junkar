import {
  FaClipboardCheck,
  FaChartLine,
  FaRupeeSign,
  FaShieldAlt,
  FaUsers
} from 'react-icons/fa';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const ScrapperSolutions = () => {
  const staticTexts = [
    "Why Choose Junkar?",
    "Guaranteed Daily Orders",
    "Get consistent daily pickup requests. No more waiting for orders, steady income guaranteed.",
    "Transparent Rates",
    "See real-time market rates before accepting orders. Know exactly what you'll earn upfront.",
    "Higher Income",
    "Earn more with competitive rates and bonus incentives. Maximize your daily earnings potential.",
    "Safe Handling Supply",
    "Work with verified customers and safe pickup locations. Your safety is our priority.",
    "Wider Customer Access",
    "Access to a large customer base across your area. More pickups, more opportunities to earn."
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  const solutions = [
    {
      icon: FaClipboardCheck,
      title: getTranslatedText('Guaranteed Daily Orders'),
      description: getTranslatedText('Get consistent daily pickup requests. No more waiting for orders, steady income guaranteed.'),
      color: '#0ea5e9'
    },
    {
      icon: FaChartLine,
      title: getTranslatedText('Transparent Rates'),
      description: getTranslatedText("See real-time market rates before accepting orders. Know exactly what you'll earn upfront."),
      color: '#0ea5e9'
    },
    {
      icon: FaRupeeSign,
      title: getTranslatedText('Higher Income'),
      description: getTranslatedText('Earn more with competitive rates and bonus incentives. Maximize your daily earnings potential.'),
      color: '#0ea5e9'
    },
    {
      icon: FaShieldAlt,
      title: getTranslatedText('Safe Handling Supply'),
      description: getTranslatedText('Work with verified customers and safe pickup locations. Your safety is our priority.'),
      color: '#0ea5e9'
    },
    {
      icon: FaUsers,
      title: getTranslatedText('Wider Customer Access'),
      description: getTranslatedText('Access to a large customer base across your area. More pickups, more opportunities to earn.'),
      color: '#0ea5e9'
    }
  ];

  return (
    <div className="mb-6">
      <h3
        className="text-2xl font-bold mb-4 text-center"
        style={{ color: '#2d3748' }}
      >
        {getTranslatedText("Why Choose Junkar?")}
      </h3>

      <div className="flex flex-col gap-2.5 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3">
        {solutions.map((solution, index) => {
          const IconComponent = solution.icon;

          return (
            <div key={solution.title}>
              <div
                className="rounded-xl p-3.5 h-full"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(226, 232, 240, 0.8)'
                }}
              >
                <div className="flex items-center gap-2.5">
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: '#0ea5e9',
                      color: '#ffffff'
                    }}
                  >
                    <IconComponent size={16} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4
                      className="font-bold text-sm mb-1 leading-tight"
                      style={{ color: '#1e293b' }}
                    >
                      {solution.title}
                    </h4>
                    <p
                      className="text-xs leading-snug"
                      style={{ color: '#64748b' }}
                    >
                      {solution.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScrapperSolutions;


import { useTranslation } from "react-i18next";

const PrivacyPolicy = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t("privacy_policy_title")}
              </h2>
              <p className="text-sm text-gray-600 mb-1">
                {t("privacy_policy_effective_date")}
              </p>
              <p className="text-sm text-gray-600">
                {t("privacy_policy_last_updated")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              aria-label={t("privacy_policy_close")}
            >
              ×
            </button>
          </div>

          <div className="prose prose-sm max-w-none">
            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Introduction</h3>
              <p className="text-gray-700 mb-4">
                {t("privacy_policy_introduction")} We are registered with the Office of the Data Protection Commissioner under registration number [Insert Registration Number].
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Information We Collect</h3>
              <p className="text-gray-700 mb-3">
                We collect information you provide directly, including your name, email, phone number, national ID for verification, and location details for your county, constituency, and ward. When you engage with our platform, we collect the civic issues you report, messages to representatives, poll responses, and policy feedback you submit.
              </p>
              <p className="text-gray-700 mb-3">
                Our system automatically collects technical information such as your device type, browser, IP address, and how you use our platform. With your permission, we may collect GPS coordinates when you report location-specific issues. For offline functionality, we store certain content locally on your device and sync it when you reconnect.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-3">How We Use Your Information</h3>
              <p className="text-gray-700 mb-3">
                Your information enables core civic engagement features like connecting you with your representatives, routing your issues to appropriate officials, and providing personalized policy analysis. We use aggregated data to improve platform performance, develop new features, and understand usage patterns.
              </p>
              <p className="text-gray-700 mb-3">
                We send you notifications about your civic issues, responses from representatives, and important platform updates. Your information also helps us verify representative identities, ensure platform security, and comply with legal obligations under Kenyan law.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Information Sharing</h3>
              <p className="text-gray-700 mb-3">
                When you report issues or send messages to representatives, your name and contact information are shared with them. Representatives can view aggregated engagement data from their constituents. Your public forum posts and policy comments are visible to all users, and we may publish anonymized civic engagement statistics.
              </p>
              <p className="text-gray-700 mb-3">
                We work with trusted third-party providers including Microsoft Azure for cloud hosting, email services for notifications, and security tools for platform protection. We only share the minimum data necessary for these services to function. We may disclose information when legally required by valid court orders, law enforcement requests, or to prevent illegal activities.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Data Security</h3>
              <p className="text-gray-700 mb-3">
                We protect your information using industry-standard security measures including encryption for all data transmission and storage, secure authentication systems, and regular security audits. Our data is stored in secure, monitored facilities with strict access controls limited to authorized personnel only.
              </p>
              <p className="text-gray-700 mb-3">
                Our team receives regular privacy and security training, and we maintain comprehensive incident response procedures. All third-party providers must meet our security standards and comply with applicable data protection laws.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Your Rights</h3>
              <p className="text-gray-700 mb-3">
                Under Kenyan law, you have the right to access, correct, or delete your personal information. You can request your data in a portable format, restrict how we process it, or withdraw consent for data processing. You can opt out of marketing communications and request account closure at any time.
              </p>
              <p className="text-gray-700 mb-3">
                To exercise these rights, contact our Data Protection Officer at privacy@civicbridgepulse.ke. We'll respond to your request within the timeframes required by law.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Data Retention</h3>
              <p className="text-gray-700 mb-3">
                We retain your personal information while your account is active and for up to two years for analytics purposes. Messages and civic content are kept indefinitely for historical record unless you request deletion. Accounts inactive for three years are automatically deactivated, with personal data deleted six months later, though public content may be retained in anonymized form.
              </p>
              <p className="text-gray-700 mb-3">
                Legal requirements may extend retention periods for certain records. We regularly review and delete data that's no longer necessary for our stated purposes.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Special Considerations</h3>
              <p className="text-gray-700 mb-3">
                CivicBridgePulse Kenya is intended for users 18 and older. If we discover information from anyone younger, we immediately delete it and terminate the account. For vulnerable users, we provide enhanced privacy protections, pseudonymous options where appropriate, and special handling for sensitive reports.
              </p>
              <p className="text-gray-700 mb-3">
                Some data may be transferred internationally through our cloud providers, but only with appropriate legal safeguards in place. We use essential cookies for platform functionality and optional cookies for analytics and improvements, which you can manage through your browser settings.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Contact and Complaints</h3>
              <p className="text-gray-700 mb-3">
                Our Data Protection Officer can be reached at j.mukamani@alustudent.com for any privacy questions or concerns. For general support, contact j.mukamani@alustudent.com during business hours (Monday-Friday, 8:00 AM - 5:00 PM EAT).
              </p>
              <p className="text-gray-700 mb-3">
                If you're unsatisfied with our response to privacy concerns, you may file a complaint with the Office of the Data Protection Commissioner at www.odpc.go.ke, info@odpc.go.ke, or +254-20-2628000.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Policy Updates</h3>
              <p className="text-gray-700 mb-3">
                We may update this policy to reflect legal changes, new features, or improved practices. We'll notify all users by email and display a prominent notice on our platform for 30 days. Continued use after changes indicates acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-6">
              <p className="text-gray-700 font-medium">
                By using CivicBridgePulse Kenya, you acknowledge that you have read, understood, and agree to this Privacy Policy.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Version 1.0 - 19/07/2025
              </p>
            </section>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              {t("privacy_policy_close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 
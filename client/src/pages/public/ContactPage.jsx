import React, { useState } from 'react';
import { Mail, MessageCircle, MapPin, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { siteContent } from '../../content/site';
import { contactService } from '../../services/contact.service';
import { useDocumentMeta } from '../../utils/seo';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';

export const ContactPage = () => {
  useDocumentMeta({
    title: 'Contact Admissions — CodeCraft Bootcamp',
    description: 'Ask questions about our upcoming cohort, installment options, or technical prerequisites.',
    canonicalPath: '/contact',
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please provide your name, email, and message.');
      return;
    }

    setSubmitting(true);
    try {
      await contactService.submitContactMessage(formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send message. Please try WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappLink = `https://wa.me/${siteContent.brand.whatsappDigits}?text=${encodeURIComponent(
    'Hi! I have an inquiry regarding CodeCraft Bootcamp admissions.'
  )}`;

  return (
    <div className="py-12 md:py-20 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Editorial Header */}
      <div className="max-w-2xl mb-12">
        <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider block mb-2">
          Admissions & Inquiries
        </span>
        <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-ink leading-tight tracking-tight">
          Direct answers from real engineers.
        </h1>
        <p className="text-sm text-ink-muted mt-3 leading-relaxed">
          Have questions about the syllabus, laptop specifications, or payment plans? Send us a message or text us directly on WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Contact Form */}
        <div className="lg:col-span-7 bg-surface border border-line rounded-lg p-6 sm:p-8">
          {submitted ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-primary-soft text-primary mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-semibold text-xl text-ink mb-2">
                Message Received
              </h3>
              <p className="text-xs sm:text-sm text-ink-muted max-w-sm mx-auto mb-6">
                Thank you for reaching out. An admissions mentor will review your inquiry and reply via email or WhatsApp within 24 hours.
              </p>
              <Button variant="secondary" size="sm" onClick={() => setSubmitted(false)}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-danger-soft border border-danger/20 rounded text-xs text-danger flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Your Full Name" required>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Ali Ahmed"
                    required
                  />
                </FormField>

                <FormField label="Email Address" required>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ali@example.com"
                    required
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="WhatsApp / Mobile Number" helper="Optional (for fast responses)">
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0300 1234567"
                  />
                </FormField>

                <FormField label="Subject" helper="Optional">
                  <Input
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g. Schedule Query"
                  />
                </FormField>
              </div>

              <FormField label="Message or Question" required helper="Be as specific as you like">
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Tell us about your background and any questions regarding the upcoming batch..."
                  required
                />
              </FormField>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting}
                  isLoading={submitting}
                  rightIcon={Send}
                  className="w-full sm:w-auto"
                >
                  {submitting ? 'Sending inquiry...' : 'Send Message'}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Direct Channels & Information */}
        <div className="lg:col-span-5 space-y-6">
          {/* WhatsApp Direct Action */}
          <div className="bg-surface border border-line rounded-lg p-6">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-primary uppercase tracking-wider font-mono mb-2">
              <MessageCircle className="w-4 h-4" />
              Direct WhatsApp Support
            </div>
            <p className="text-xs text-ink-muted leading-relaxed mb-4">
              Need immediate advice or want to confirm installment seat availability? Message our admissions team directly:
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded bg-primary text-surface font-medium text-xs hover:bg-primary-hover transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Chat on WhatsApp ({siteContent.brand.whatsappDisplay})
            </a>
          </div>

          {/* Location & Coordinates */}
          <div className="bg-surface border border-line rounded-lg p-6 space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-ink block">Admissions Email</span>
                <a
                  href={`mailto:${siteContent.brand.supportEmail}`}
                  className="text-ink-muted hover:text-ink underline"
                >
                  {siteContent.brand.supportEmail}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t border-line">
              <Clock className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-ink block">Standard Timezone</span>
                <span className="text-ink-muted">{siteContent.brand.timezone}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t border-line">
              <MapPin className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-ink block">Location & Delivery</span>
                <span className="text-ink-muted">{siteContent.brand.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

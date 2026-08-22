class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch("MAIL_FROM", "Prayer Journal <prayer@localhost>")
  layout "mailer"

  after_action :set_unsubscribe_headers

  private
    def set_unsubscribe_headers
      headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"
      headers["List-Unsubscribe"] = "<#{privacy_url}>"
    end
end


class CircleMailer < ApplicationMailer
  def new_request
    @prayer_request = params[:prayer_request]
    @recipient = params[:recipient]
    mail to: @recipient.email_address, subject: "New prayer: #{@prayer_request.title}"
  end

  def request_answered
    @prayer_request = params[:prayer_request]
    @recipient = params[:recipient]
    mail to: @recipient.email_address, subject: "Answered: #{@prayer_request.title}"
  end
end

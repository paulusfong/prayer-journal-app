class AnswersController < ApplicationController
  before_action :set_prayer_request

  def create
    unless @prayer_request.status_open?
      redirect_to @prayer_request
      return
    end

    @prayer_request.answer!(by: Current.user)
    @prayer_request.notify_answered
    redirect_to answered_prayer_requests_path, notice: "Marked answered."
  end

  def destroy
    unless @prayer_request.status_answered?
      redirect_to @prayer_request
      return
    end

    @prayer_request.reopen!
    redirect_to @prayer_request, notice: "Reopened."
  end
end

class RequestUpdatesController < ApplicationController
  before_action :set_prayer_request
  before_action :require_author
  before_action :set_request_update, only: :destroy

  def create
    @request_update = @prayer_request.request_updates.new(update_params)
    @request_update.author = Current.user
    if @request_update.save
      redirect_to @prayer_request, notice: "Update added."
    else
      redirect_to @prayer_request, alert: @request_update.errors.full_messages.to_sentence
    end
  end

  def destroy
    unless @request_update.author_id == Current.user.id
      head :forbidden
      return
    end

    @request_update.destroy!
    redirect_to @prayer_request, notice: "Update removed.", status: :see_other
  end

  private
    def require_author
      head :forbidden unless @prayer_request.author_id == Current.user.id
    end

    def set_request_update
      @request_update = @prayer_request.request_updates.find(params[:id])
    end

    def update_params
      params.expect(request_update: [ :body ])
    end
end

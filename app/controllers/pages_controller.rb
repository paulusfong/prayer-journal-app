class PagesController < ApplicationController
  allow_unauthenticated_access only: :privacy
  allow_without_membership

  def privacy
  end
end

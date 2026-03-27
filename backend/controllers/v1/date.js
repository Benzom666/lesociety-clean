const mongoose = require("mongoose");
const Dates = require("../../models/dates");
const helper = require("../../helpers/helper");
const User = require("../../models/user");
const ChatRoom = require("../../models/chat_room");

/**
 * Listing of users based on full_name, sort and order
 * Default current_page is 1 and per_page will be 10
 * @param current_page int
 * @param per_page int
 * @param sort string
 * @param order int
 */

exports.getAllDates = async (req, res) => {
    console.log("req", req.query);
    let {
        current_page = 1,
        per_page = 10,
        location = "",
        province = "",
        prioritize_location = "",
        prioritize_province = "",
        sort = "created_at",
        order = -1,
        assetOnly = false,
        status = "",
    } = req.query;

    const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    try {
        console.log("current_page", current_page);

        let userDetails = await User.findOne({ _id: req.datajwt.userdata._id });
        let userNameCondition;
        let { gender, country_code, role, user_name } = userDetails;
        if (req.query.user_name) {
            userNameCondition = user_name &&
                user_name.length && {
                    $and: [
                        {
                            user_name: {
                                $nin: [
                                    ...userDetails.blocked_users_by_self,
                                    ...userDetails.blocked_by_others,
                                ],
                            },
                        },
                        { user_name: { $eq: req.query.user_name } },
                    ],
                };
        } else {
            userNameCondition = user_name &&
                user_name.length && {
                    user_name: {
                        $nin: [
                            ...userDetails.blocked_users_by_self,
                            ...userDetails.blocked_by_others,
                        ],
                    },
                };
        }

        // Allow admin and female users to search for any country
        // Male users are restricted to their own country_code
        if (
            role == 2 ||
            (["female", "F", "f"].includes(String(gender).toLowerCase()) && req.query.country_code)
        ) {
            country_code = req.query.country_code;
        }

        current_page = parseInt(current_page);
        per_page = parseInt(per_page);

        if (current_page < 1)
            res.status(400).json(
                helper.errorResponse([], 400, "Invalid page number, should start with 1.")
            );

        const skip = per_page * (current_page - 1);

        const normalizedLocation = location ? String(location).trim() : "";
        const locationRegex = normalizedLocation
            ? new RegExp(`^${escapeRegExp(normalizedLocation)}(,|$)`, "i")
            : null;
        const normalizedProvince = province ? String(province).trim() : "";
        const normalizedPriorityLocation = prioritize_location
            ? String(prioritize_location).trim()
            : "";
        const priorityLocationRegex = normalizedPriorityLocation
            ? new RegExp(`^${escapeRegExp(normalizedPriorityLocation)}(,|$)`, "i")
            : null;
        const normalizedPriorityProvince = prioritize_province
            ? String(prioritize_province).trim().toLowerCase()
            : "";
        const shouldPrioritizeFeed =
            !normalizedLocation &&
            (normalizedPriorityLocation.length > 0 || normalizedPriorityProvince.length > 0);

        let query = {
            status: { $nin: [3, 4, 6] }, // exclude blocked, deleted, and warned dates by default
            date_status: true, // do not fetch draft dates
            ...(normalizedLocation && { location: { $regex: locationRegex } }),
            ...(country_code && country_code.length && { country_code: { $eq: country_code } }),
            ...(normalizedProvince && {
                province: { $regex: new RegExp(`^${escapeRegExp(normalizedProvince)}$`, "i") },
            }),
            ...(status && status.length && { status: { $eq: +status } }),
            ...userNameCondition,
        };

        if (req.query.user_name) {
            delete query.date_status;
        }

        if (status == 5) {
            // to return new dates
            query = { ...query, is_new: true, status: { $ne: 4 } };
        }

        const total_dates = await Dates.countDocuments(query).collation({
            locale: "en",
            strength: 2,
        });

        console.log(total_dates);
        const total_pages = Math.ceil(total_dates / per_page);

        if (total_pages == 0) {
            return res.status(200).json({
                status: 200,
                error: false,
                message: "Success",
                data: {
                    dates: [],
                    pagination: {
                        current_page: 1,
                        per_page: per_page,
                        total_pages: 0,
                        total_dates: 0
                    }
                }
            });
        }

        if (current_page > total_pages) {
            return res
                .status(400)
                .json(
                    helper.errorResponse(
                        [],
                        400,
                        "Invalid page number, can't be greater than total pages."
                    )
                );
        }

        const sortStage = shouldPrioritizeFeed
            ? {
                  feed_priority: 1,
                  [sort]: order,
              }
            : {
                  [sort]: order,
              };

        const aggregationPipeline = [
            { $match: query },
            ...(shouldPrioritizeFeed
                ? [
                      {
                          $addFields: {
                              feed_priority: {
                                  $switch: {
                                      branches: [
                                          ...(priorityLocationRegex
                                              ? [
                                                    {
                                                        case: {
                                                            $regexMatch: {
                                                                input: { $ifNull: ["$location", ""] },
                                                                regex: priorityLocationRegex,
                                                            },
                                                        },
                                                        then: 0,
                                                    },
                                                ]
                                              : []),
                                          ...(normalizedPriorityProvince
                                              ? [
                                                    {
                                                        case: {
                                                            $eq: [
                                                                {
                                                                    $toLower: {
                                                                        $ifNull: ["$province", ""],
                                                                    },
                                                                },
                                                                normalizedPriorityProvince,
                                                            ],
                                                        },
                                                        then: 1,
                                                    },
                                                ]
                                              : []),
                                      ],
                                      default: 2,
                                  },
                              },
                          },
                      },
                  ]
                : []),
            { $sort: sortStage },
            {
                $lookup: {
                    from: "users",
                    let: { lookupUserName: "$user_name" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$user_name", "$$lookupUserName"],
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                                user_name: 1,
                                age: 1,
                                images: 1,
                                un_verified_images: 1,
                                description: 1,
                                tagline: 1,
                                aspirationName: 1,
                                occupation: 1,
                                documents_verified: 1,
                            },
                        },
                    ],
                    as: "user_data",
                },
            },
            { $skip: skip },
            { $limit: per_page },
        ];

        const datesData = await Dates.aggregate(aggregationPipeline).collation({
            locale: "en",
            strength: 2,
        });

        return res.status(200).json(
            helper.successResponse(
                {
                    dates: datesData,
                    pagination: {
                        current_page,
                        per_page,
                        total_dates,
                        total_pages,
                    },
                },
                200,
                "All dates fetched successfully!"
            )
        );
    } catch (err) {
        console.log("err catched", err);
        return res.status(500).json(helper.errorResponse(err, 500, "Something went wrong."));
    }
};

/**
 * Get draft date
 * Only post can be in draft.
 * date_status label is uesed to do this. By default it's false, means draft.
 */
exports.getDraftDate = async (req, res) => {
    try {
        const dateInDraft = await Dates.findOne({
            date_status: false,
            user_name: req.datajwt.userdata.user_name,
        });
        if (dateInDraft) {
            return res
                .status(200)
                .json(helper.successResponse(dateInDraft, 200, "Date fetched successfully!"));
        } else {
            return res
                .status(404)
                .json(helper.successResponse(dateInDraft, 200, "Date not found!"));
        }
    } catch (error) {
        return res
            .status(400)
            .json(helper.errorResponse({ error: error.message }, 400, "Failed to fetch date"));
    }
};

/**
 * Get create-date entry state for the authenticated user.
 * This is the single server-backed source of truth for:
 * - active date limit
 * - draft resume
 * - fresh create eligibility
 */
exports.getCreateEntry = async (req, res) => {
    try {
        const userName = req?.datajwt?.userdata?.user_name;

        if (!userName) {
            return res
                .status(401)
                .json(
                    helper.errorResponse(
                        { error: "Failed to authenticate token!" },
                        401,
                        "Failed to authenticate token!"
                    )
                );
        }

        const [draftDate, activeCount] = await Promise.all([
            Dates.findOne({
                date_status: false,
                user_name: userName,
            })
                .sort({ updated_at: -1, created_at: -1 })
                .lean(),
            Dates.countDocuments({
                date_status: true,
                user_name: userName,
                status: { $nin: [3, 4, 6] },
            }),
        ]);

        const hasDraft = Boolean(draftDate);
        const limitReached = activeCount >= 4;

        return res.status(200).json(
            helper.successResponse(
                {
                    can_create: hasDraft || !limitReached,
                    limit_reached: limitReached,
                    has_draft: hasDraft,
                    active_count: activeCount,
                    draft_date: draftDate || null,
                    resume_mode: hasDraft ? "draft-edit" : "create",
                },
                200,
                "Create date entry state fetched successfully!"
            )
        );
    } catch (error) {
        return res
            .status(400)
            .json(
                helper.errorResponse(
                    { error: error.message },
                    400,
                    "Failed to fetch create date entry state"
                )
            );
    }
};

/**
 * Get date by id
 */
exports.getDateById = async (req, res) => {
    try {
        const { id } = req.params;
        const date = await Dates.findById(id).lean();

        if (!date) {
            return res.status(404).json(helper.errorResponse([], 404, "Date not found"));
        }

        const userData = await User.findOne(
            { user_name: date.user_name },
            { _id: 0, images: 1, un_verified_images: 1, description: 1, tagline: 1, user_name: 1 }
        ).lean();

        return res
            .status(200)
            .json(helper.successResponse({ ...date, user_data: userData ? [userData] : [] }, 200, "Date fetched successfully!"));
    } catch (error) {
        return res
            .status(400)
            .json(helper.errorResponse({ error: error.message }, 400, "Failed to fetch date"));
    }
};

/**
 * Create date
 * 1. First check if any post is in draft if yes then not allowed to created new date
 * 2. Check if user already has 4 active dates (max limit)
 * 3. If no draft found and under limit, then create new date.
 */
exports.date = async (req, res) => {
    try {
        const { isUpdate = false } = req.body;
        const { user_name, gender } = req.datajwt.userdata;

        console.log("date creation started");

        if (!isUpdate) {
            // Check for draft dates
            const dateInDraft = await Dates.findOne({
                date_status: false,
                user_name: user_name,
            });

            if (dateInDraft) {
                return res
                    .status(403)
                    .json(
                        helper.errorResponse(
                            { error: "You already have a date in draft." },
                            403,
                            "You already have a date in draft."
                        )
                    );
            }

            // Check for max active dates limit (4 dates max - one per photo)
            const activeDatesCount = await Dates.countDocuments({
                date_status: true,
                user_name: user_name,
                status: { $nin: [3, 4, 6] } // Exclude blocked, deleted, warned dates
            });

            if (activeDatesCount >= 4) {
                return res
                    .status(403)
                    .json(
                        helper.errorResponse(
                            { error: "You've reached your limit of 4 active dates." },
                            403,
                            "You've reached your limit of 4 active dates."
                        )
                    );
            }
        }

        // Validate gender field for proper handling
        const normalizedGender = String(gender || "").toLowerCase();
        if (!["male", "female", "m", "f"].includes(normalizedGender)) {
            return res
                .status(400)
                .json(
                    helper.errorResponse(
                        { error: "Invalid gender information. Please update your profile." },
                        400,
                        "Invalid gender information. Please update your profile."
                    )
                );
        }

        const dateObj = new Dates({
            ...req.body,
            ...(isUpdate && { is_new: true }),
            updated_at: new Date(),
        });

        const success = await dateObj.save();

        if (success) {
            const success_message =
                isUpdate == "true" || isUpdate == true
                    ? "Date updated successfully!"
                    : "Date created successfully!";
            return res.status(201).json(helper.successResponse(success, 201, success_message));
        } else {
            return res
                .status(500)
                .json(
                    helper.errorResponse(
                        { error: "Failed to create date. Refresh the page and retry." },
                        500,
                        "Failed to create date. Refresh the page and retry."
                    )
                );
        }
    } catch (error) {
        console.error("Date creation error:", error);
        return res
            .status(400)
            .json(helper.errorResponse({ error: error.message }, 400, "Failed to create date"));
    }
};

/**
 * Update date
 */
exports.updateDate = async (req, res) => {
    try {
        const update = req.body;
        const { date_id, user_name } = update;

        if (!mongoose.Types.ObjectId.isValid(date_id)) {
            return res
                .status(400)
                .json(helper.errorResponse({ error: "Invalid date id" }, 400, "Invalid date id"));
        }

        const doc = await Dates.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(date_id), user_name },
            {
                ...update,
                updated_at: new Date(),
            },
            { new: true, runValidators: true }
        );

        if (!doc) {
            return res
                .status(404)
                .json(
                    helper.errorResponse(
                        { error: "Date not found for this user." },
                        404,
                        "Date not found for this user."
                    )
                );
        }

        return res
            .status(200)
            .json(
                helper.successResponse(
                    { date: helper.dateResponse(doc) },
                    201,
                    "Date updated successfully!"
                )
            );
    } catch (error) {
        res.status(400).json(
            helper.errorResponse({ error: error.message }, 400, "Failed to update date")
        );
    }
};

/**
 * Delete draft date if exists.
 */
exports.deleteDate = async (req, res) => {
    try {
        const dateInDraft = await Dates.findOne({
            date_status: false,
            user_name: req.datajwt.userdata.user_name,
        });

        if (dateInDraft) {
            let success = await dateInDraft.delete();

            if (success) {
                return res
                    .status(200)
                    .json(helper.successResponse(success, 200, "Date deleted successfully!"));
            } else {
                return res
                    .status(500)
                    .json(
                        helper.errorResponse(
                            { error: "Failed to create date. Refresh the page and retry." },
                            500,
                            "Failed to create date. Refresh the page and retry."
                        )
                    );
            }
        } else {
            return res.status(200).json(helper.successResponse([], 200, "Draft Date not found!"));
        }
    } catch (error) {
        return res
            .status(400)
            .json(helper.errorResponse({ error: error.message }, 400, "Failed to create date"));
    }
};

/**
 * delete Dates by date ids
 */
exports.deleteDateByIds = async (req, res) => {
    try {
        const ids = Array.isArray(req.body?.ids)
            ? req.body.ids.filter(Boolean)
            : req.body?.ids
            ? [req.body.ids]
            : [];

        if (!ids.length) {
            return res
                .status(400)
                .json(helper.errorResponse({ error: "No date ids provided." }, 400, "No date ids provided."));
        }

        const datesDeleted = await Dates.deleteMany({
            _id: { $in: ids },
        });

        if (datesDeleted.deletedCount) {
            return res
                .status(200)
                .json(helper.successResponse(datesDeleted, 200, "Date deleted successfully!"));
        } else {
            return res.status(200).json(helper.successResponse([], 200, " Dates not found!"));
        }
    } catch (error) {
        return res
            .status(400)
            .json(helper.errorResponse({ error: error.message }, 400, "Failed to delete dates."));
    }
};

/**
 * Update draft date status
 */
exports.updateDraftStatus = async (req, res) => {
    try {
        const { date_status } = req.body;

        let { user_name, role } = req.datajwt.userdata;

        if (role == 2) {
            return res
                .status(400)
                .json(helper.errorResponse(error, 400, "Admin can not update draft date."));
        }

        const dateInDraft = await Dates.findOne({ date_status: false, user_name: user_name });

        if (dateInDraft) {
            if (date_status === true) {
                const activeDatesCount = await Dates.countDocuments({
                    date_status: true,
                    user_name,
                    status: { $nin: [3, 4, 6] },
                });

                if (activeDatesCount >= 4) {
                    return res
                        .status(403)
                        .json(
                            helper.errorResponse(
                                { error: "You've reached your limit of 4 active dates." },
                                403,
                                "You've reached your limit of 4 active dates."
                            )
                        );
                }
            }

            dateInDraft.date_status = date_status;
            // dateInDraft.is_new = false;
            dateInDraft.updated_at = new Date();
            await dateInDraft.save();
            return res
                .status(200)
                .json(helper.successResponse(dateInDraft, 200, "Date fetched successfully!"));
        }

        return res
            .status(404)
            .json(helper.successResponse(dateInDraft, 200, "Draft date not found!"));
    } catch (error) {
        res.status(400).json(
            helper.errorResponse({ error: error.message }, 400, "Failed to update date")
        );
    }
};

/**
 * @param req
 * @param res
 * Update date status as 1 : Pending, 2: Verified, 3 Block ( deactivated ), 4: Delete ( soft ), 6: Warned 7: Re Submitted
 */
exports.updateStatus = async (req, res) => {
    try {
        const loginUserId = req.datajwt.userdata._id; //admin ID
        const { status, ids } = req.body;

        Dates.updateMany(
            { _id: { $in: ids } },
            {
                $set: {
                    status: +status,
                    // is_new: false,
                    is_blocked_by_admin: 1,
                    blocked_date: new Date(),
                },
                updated_at: new Date(),
            },
            (error, result) => {
                console.log(result);
                if (error) {
                    return res
                        .status(400)
                        .json(helper.errorResponse(error, 400, "Failed to update date status"));
                }
                if (result.modifiedCount >= 1) {
                    ChatRoom.updateMany(
                        { date_id: { $in: ids } },
                        {
                            $set: { status: 2, blocked_by: loginUserId, is_blocked_by_admin: 1 },
                            updated_at: new Date(),
                        },
                        (error, result) => {
                            if (error) {
                                return res
                                    .status(400)
                                    .json(
                                        helper.errorResponse(
                                            error,
                                            400,
                                            "Failed to update date associated chatrooms status"
                                        )
                                    );
                            }
                            return res
                                .status(200)
                                .json(
                                    helper.successResponse(
                                        [],
                                        201,
                                        "Date status updated successfully!"
                                    )
                                );
                        }
                    );
                } else {
                    return res
                        .status(200)
                        .json(helper.successResponse([], 201, "Date status updated successfully!"));
                }
                return res
                    .status(200)
                    .json(helper.successResponse([], 201, "Date status updated successfully!"));
            }
        );
    } catch (error) {
        return res.status(500).json(helper.errorResponse(error, 500, error));
    }
};

exports.getStats = async (req, res) => {
    let stats = {
        total_dates: 0,
        verified_dates: 0,
        pending_dates: 0,
        deactivated_dates: 0,
        new_dates: 0,
        warned_dates: 0,
        re_submitted_dates: 0,
    };
    try {
        const totalDates = await Dates.countDocuments({
            status: { $nin: [3, 6] },
            date_status: true,
        });

        const pendingDates = await Dates.aggregate([
            { $match: { date_status: false } },
            { $count: "pending_dates" },
        ]);

        const verifiedDates = await Dates.aggregate([
            { $match: { date_status: true } },
            { $count: "verified_dates" },
        ]);

        const deactivatedDates = await Dates.aggregate([
            { $match: { status: 3 } },
            { $count: "deactivated_dates" },
        ]);

        const newDates = await Dates.aggregate([
            { $match: { is_new: true, date_status: true } },
            { $count: "new_dates" },
        ]);

        const warnedDates = await Dates.aggregate([
            { $match: { status: 6 } },
            { $count: "warned_dates" },
        ]);

        const reSubmittedDates = await Dates.aggregate([
            { $match: { status: 7 } },
            { $count: "re_submitted_dates" },
        ]);

        if (totalDates) {
            stats.total_dates = totalDates;
        }

        if (verifiedDates.length) {
            stats.verified_dates = verifiedDates[0].verified_dates;
        }

        if (pendingDates.length) {
            stats.pending_dates = pendingDates[0].pending_dates;
        }

        if (deactivatedDates.length) {
            stats.deactivated_dates = deactivatedDates[0].deactivated_dates;
        }

        if (newDates.length) {
            stats.new_dates = newDates[0].new_dates;
        }

        if (warnedDates.length) {
            stats.warned_dates = warnedDates[0].warned_dates;
        }

        if (reSubmittedDates.length) {
            stats.re_submitted_dates = reSubmittedDates[0].re_submitted_dates;
        }

        res.status(200).json(helper.successResponse(stats, 200, "Posts ( Dates ) stats."));
    } catch (error) {
        return res.status(500).json(helper.errorResponse(error, 500, error));
    }
};

// Make is new false
exports.seenDatesByIds = async (req, res) => {
    try {
        const { ids } = req.body;

        const datesUpdated = await Dates.updateMany({ _id: { $in: ids } }, { is_new: false });

        if (datesUpdated) {
            return res
                .status(200)
                .json(helper.successResponse(datesUpdated, 200, "Date updated successfully!"));
        } else {
            return res.status(200).json(helper.successResponse([], 200, "Dates not found!"));
        }
    } catch (error) {
        return res
            .status(400)
            .json(helper.errorResponse({ error: error.message }, 400, "Failed to delete dates."));
    }
};

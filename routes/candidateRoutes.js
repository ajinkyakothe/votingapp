const express = require("express");
const router = express.Router();
const Candidate = require("./../models/candidate");
const { jwtAuthMiddleware, generateToken } = require("./../jwt");
const User = require("../models/user");

const checkAdminRole = async (userID) => {
  try {
    const user = await User.findById(userID);
    if (user.role === "admin") {
      return true;
    }
  } catch (err) {
    return false;
  }
};

router.post("/", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id)))
      return res.status(403).json({ message: "user does not have admin role" });

    const data = req.body;

    const newCandidate = new Candidate(data);

    const response = await newCandidate.save();
    console.log("data saved ");
    res.status(200).json({ response: response });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!checkAdminRole(req.user.id))
      return res.status(403).json({ message: "user does not have admin role" });

    const candidateID = req.params.candidateID;
    const updatedCandidateData = req.body;

    const response = await Candidate.findByIdAndUpdate(
      candidateID,
      updatedCandidateData,
      {
        new: true, // Return the updated document
        runValidators: true, // Run Mongoose validation
      }
    );

    if (!response) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    console.log("candidate data updated");
    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:candidateID", jwtAuthMiddleware, async (req, res) => {
  try {
    if (!checkAdminRole(req.user.id))
      return res.status(403).json({ message: "user does not have admin role" });

    const candidateID = req.params.candidateID;

    const response = await Candidate.findByIdAndDelete(candidateID);

    if (!response) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    console.log("candidate deleted");
    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/vote/:candidateID", jwtAuthMiddleware, async (req, res) => {
  candidateID = req.params.candidateID;
  userId = req.user.id;

  try {
    const candidate = await Candidate.findById(candidateID);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    if (user.isVoted) {
      return res.status(400).json({ message: "You have already voted " });
    }

    if (user.role == "admin") {
      res.status(403).json({ message: "admin is not allowed" });
    }

    candidate.votes.push({ user: userId });
    candidate.voteCount++;
    await candidate.save();

    user.isVoted = true;
    await user.save();

    res.status(200).json({ message: "Vote recorded succesfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/vote/count", async (req, res) => {
  try {
    const candidate = await Candidate.find().sort({ voteCount: "desc" });

    const voteRecord = candidate.map((data) => {
      return {
        party: data.party,
        count: data.voteCount,
      };
    });

    res.status(200).json(voteRecord);
  } catch (error) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/getcandidate", async (req, res) => {
  try {
    //to get the list of the candidate
    const calCandidate = await Candidate.find();

    const showCandidate = calCandidate.map((data) => {
      return {
        name: data.name,
        party: data.party,
      };
    });

    res.status(200).json(showCandidate);
  } catch (error) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
